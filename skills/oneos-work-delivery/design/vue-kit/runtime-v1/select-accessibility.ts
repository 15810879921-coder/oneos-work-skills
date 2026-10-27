import { onBeforeUnmount, onMounted, type Ref } from 'vue';

/** Ant 4.2.6 leaves closed Select references pointing at an unmounted list.
 * Repair ARIA metadata only inside the opted-in page. Values, events and focus
 * remain owned by Ant. Explicit labels remain the business page's responsibility.
 */
export function useSelectAccessibility(root: Ref<HTMLElement | undefined>) {
  let observer: MutationObserver | undefined;
  let labelIndex = 0;
  const references = new WeakMap<HTMLInputElement, Map<string, string>>();
  const managedNames = new WeakMap<HTMLInputElement, Map<string, string>>();
  const set = (el: Element, key: string, value: string) => {
    if (el.getAttribute(key) !== value) el.setAttribute(key, value);
  };
  function repair() {
    const surface = root.value;
    if (!surface) return;
    for (const input of surface.querySelectorAll<HTMLInputElement>('.ant-select input[role="combobox"]')) {
      const select = input.closest('.ant-select')!;
      set(input, 'aria-expanded', String(select.classList.contains('ant-select-open')));
      let saved = references.get(input);
      if (!saved) { saved = new Map(); references.set(input, saved); }
      for (const key of ['aria-controls', 'aria-owns', 'aria-activedescendant']) {
        const current = input.getAttribute(key);
        if (current) saved.set(key, current);
        const value = saved.get(key);
        if (!value) continue;
        if (value.split(/\s+/).every(id => input.ownerDocument.getElementById(id))) set(input, key, value);
        else if (current) input.removeAttribute(key);
      }
      const explicitLabel = select.getAttribute('aria-label');
      const explicitLabelledBy = select.getAttribute('aria-labelledby');
      const previous = managedNames.get(input) || new Map<string, string>();
      const next = new Map<string, string>();
      const hasNativeName = ['aria-label', 'aria-labelledby'].some(key => {
        const current = input.getAttribute(key);
        return current && current !== previous.get(key);
      });
      if (hasNativeName || input.labels?.length) { /* Native business labels take priority. */ }
      else if (explicitLabelledBy) next.set('aria-labelledby', explicitLabelledBy);
      else if (explicitLabel) next.set('aria-label', explicitLabel);
      else {
        const item = select.closest('.ant-form-item');
        const label = item?.querySelector<HTMLLabelElement>('.ant-form-item-label label');
        if (label && item?.querySelectorAll('input[role="combobox"]').length === 1) {
          if (!label.id) label.id = `${input.id || 'oneos-select'}-label-${++labelIndex}`;
          next.set('aria-labelledby', label.id);
        } else if (select.classList.contains('ant-pagination-options-size-changer')) {
          next.set('aria-label', '每页条数');
        }
      }
      for (const [key, value] of previous) {
        if (!next.has(key) && input.getAttribute(key) === value) input.removeAttribute(key);
      }
      for (const [key, value] of next) set(input, key, value);
      managedNames.set(input, next);
    }
  }
  onMounted(() => {
    repair();
    observer = new MutationObserver(repair);
    if (root.value) observer.observe(root.value, { subtree: true, childList: true, attributes: true,
      attributeFilter: ['class', 'id', 'aria-label', 'aria-labelledby', 'aria-expanded', 'aria-controls', 'aria-owns', 'aria-activedescendant'] });
  });
  onBeforeUnmount(() => observer?.disconnect());
}
