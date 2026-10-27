import { theme } from 'ant-design-vue';
import { buildOneOsAntdTheme } from './base-theme';
import { resolveAppearance } from './preferences.mjs';
import { readableInk, solidForeground } from './colors.mjs';
import { RUNTIME_THEME_MARKER, RUNTIME_THEME_VALUE } from './host-theme-guard';

/** Read the existing RuoYi/Vben preferences. Never reset its store or CONFIG_VERSION. */
export function buildOneosRuntime(preferences: unknown, systemDark = false) {
  const a = resolveAppearance(preferences, systemDark);
  const config = buildOneOsAntdTheme({
    isDark: a.mode === 'dark', compact: false,
    tokens: { colorPrimary: a.primary }, controlHeight: a.controlHeight, borderRadius: a.radius,
  });
  // Explicit PC density avoids deriving compact height twice in different wrappers.
  config.token = { ...config.token, controlHeightSM: 32, controlHeightLG: 44, borderRadiusLG: a.radius };
  Object.assign(config.token, { [RUNTIME_THEME_MARKER]: RUNTIME_THEME_VALUE });
  // Small helper/status text must remain readable against the actual surface.
  Object.assign(config.token, {
    colorTextTertiary: a.mode === 'dark' ? '#A0AEC0' : '#596E83',
    colorTextDescription: a.mode === 'dark' ? '#A0AEC0' : '#596E83',
    colorSuccessText: a.mode === 'dark' ? '#6EE7B7' : '#007A55',
    colorWarningText: a.mode === 'dark' ? '#FBBF24' : '#9A5B00',
    colorErrorText: a.mode === 'dark' ? '#FF8C8C' : '#B42318',
    colorInfoText: a.mode === 'dark' ? '#93C5FD' : '#245FA6',
  });
  const component = config.components!;
  component.Card = { ...component.Card, borderRadiusLG: a.radius };
  component.Modal = { ...component.Modal, borderRadiusLG: a.radius };
  component.Dropdown = { ...component.Dropdown, borderRadiusLG: a.radius };
  component.Message = { ...component.Message, borderRadiusLG: a.radius };
  component.Notification = { ...component.Notification, borderRadiusLG: a.radius };
  component.Tooltip = { ...component.Tooltip, borderRadius: a.radius };
  const algorithm = a.mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm;
  const resolved = algorithm({ ...theme.defaultSeed, ...config.token });
  const primaryInk = readableInk(a.primary, String(config.token.colorFillSecondary), a.mode === 'dark');
  component.Tabs = { ...component.Tabs, colorPrimary: primaryInk, colorPrimaryHover: primaryInk, colorPrimaryActive: primaryInk };
  component.Spin = { ...component.Spin, colorPrimary: primaryInk };
  // Solid semantic fills belong to each component. Tooltip and custom Tag may
  // use entirely different backgrounds, so never write brand ink to the alias.
  component.Button = { ...component.Button, colorTextLightSolid: solidForeground(resolved.colorPrimary) };
  component.Steps = { ...component.Steps, colorTextLightSolid: solidForeground(resolved.colorPrimary) };
  config.token = { ...config.token, colorLink: primaryInk, colorLinkHover: primaryInk, colorLinkActive: primaryInk,
    colorPrimaryText: primaryInk, colorPrimaryTextHover: primaryInk, colorPrimaryTextActive: primaryInk };
  const t = config.token!;
  const variables: Record<string, string> = {
    '--oneos-primary': a.primary, '--oneos-primary-ink': primaryInk,
    '--oneos-primary-contrast': solidForeground(resolved.colorPrimary),
    '--oneos-primary-hover-contrast': solidForeground(resolved.colorPrimaryHover),
    '--oneos-primary-active-contrast': solidForeground(resolved.colorPrimaryActive),
    '--oneos-error-contrast': solidForeground(resolved.colorError),
    '--oneos-error-hover-contrast': solidForeground(resolved.colorErrorHover),
    '--oneos-error-active-contrast': solidForeground(resolved.colorErrorActive),
    '--oneos-primary-on-dark': readableInk(a.primary, '#202C38', true),
    '--oneos-canvas': String(t.colorBgLayout), '--oneos-surface': String(t.colorBgContainer),
    '--oneos-elevated': String(t.colorBgElevated), '--oneos-ink': String(t.colorText),
    '--oneos-body': String(t.colorTextSecondary), '--oneos-muted': a.mode === 'dark' ? '#A0AEC0' : '#596E83',
    '--oneos-line': String(t.colorBorder), '--oneos-line-soft': String(t.colorBorderSecondary),
    '--oneos-line-control': a.mode === 'dark' ? '#2D3748' : '#C7D2DD',
    '--oneos-fill': String(t.colorFillAlter), '--oneos-hover': String(t.colorFillSecondary),
    '--oneos-error': a.mode === 'dark' ? '#FF8C8C' : '#B42318',
    '--oneos-warning': a.mode === 'dark' ? '#FBBF24' : '#9A5B00',
    '--oneos-success': a.mode === 'dark' ? '#6EE7B7' : '#007A55',
    '--oneos-info': a.mode === 'dark' ? '#93C5FD' : '#245FA6',
    '--oneos-radius': `${a.radius}px`, '--oneos-control-height': `${a.controlHeight}px`,
    '--vxe-ui-font-primary-color': primaryInk,
    '--vxe-ui-font-color': String(t.colorText), '--vxe-ui-font-lighten-color': String(t.colorTextSecondary),
    '--vxe-ui-layout-background-color': String(t.colorBgContainer),
    '--vxe-ui-table-header-background-color': String(t.colorFillAlter),
    '--vxe-ui-table-footer-background-color': String(t.colorBgContainer),
    '--vxe-ui-table-row-hover-background-color': String(t.colorFillSecondary),
    '--vxe-ui-table-row-current-background-color': resolved.colorPrimaryBg,
    '--vxe-ui-table-row-striped-background-color': String(t.colorFillAlter),
    '--vxe-ui-table-row-checkbox-checked-background-color': resolved.colorPrimaryBg,
    '--vxe-ui-table-row-hover-checkbox-checked-background-color': resolved.colorPrimaryBgHover,
    '--vxe-ui-table-border-color': String(t.colorBorderSecondary),
    '--vxe-ui-table-header-font-color': String(t.colorTextSecondary),
    '--vxe-ui-base-hover-background-color': String(t.colorFillSecondary),
    '--vxe-ui-loading-background-color': a.mode === 'dark' ? 'rgba(18,20,24,.7)' : 'rgba(255,255,255,.7)',
    '--vxe-ui-table-border-radius': `${a.radius}px`, '--vxe-ui-border-radius': `${a.radius}px`,
    '--vxe-ui-font-size-default': '13px', '--vxe-ui-font-family': String(t.fontFamily),
    '--vxe-ui-input-border-color': String(t.colorBorder),
    '--vxe-ui-base-popup-border-color': String(t.colorBorder),
  };
  return { appearance: a, theme: config, variables };
}
