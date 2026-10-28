import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue';

/** Ant 4.2.6 snapshots a message/notification's theme class when opened.
 * Keep that class current without reopening notices, resetting their timers,
 * or remounting business content. Only this runtime's own known hashes and
 * notice nodes are touched; nested providers and arbitrary user classes stay.
 */
export function useNoticeTheme(root: Ref<HTMLElement | undefined>, hashId: Readonly<Ref<string>>) {
  const ownedHashes = new Set<string>();
  let observer: MutationObserver | undefined;
  function repair() {
    const surface = root.value;
    const current = hashId.value;
    if (!surface || !current) return;
    for (const notice of surface.querySelectorAll<HTMLElement>('.ant-message-notice, .ant-notification-notice')) {
      if (notice.closest('[data-oneos-runtime="1"]') !== surface) continue;
      const previous = [...notice.classList].filter(name => ownedHashes.has(name));
      if (!previous.length) continue;
      if (!notice.classList.contains(current)) notice.classList.add(current);
      for (const name of previous) if (name !== current) notice.classList.remove(name);
    }
  }
  watch(hashId, (current, previous) => {
    if (previous) ownedHashes.add(previous);
    if (current) ownedHashes.add(current);
    repair();
  }, { immediate: true, flush: 'post' });
  onMounted(() => {
    repair();
    observer = new MutationObserver(repair);
    if (root.value) observer.observe(root.value, {
      subtree: true, childList: true, attributes: true, attributeFilter: ['class'],
    });
  });
  onBeforeUnmount(() => observer?.disconnect());
}
