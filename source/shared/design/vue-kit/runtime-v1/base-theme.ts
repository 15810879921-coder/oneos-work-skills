// Generated from ../antd-theme.ts; sha256=27f58e6513dfdf95ea8abc500e813922c015a233e0473670aca675f7fea85777. Do not edit.
/**
 * 现网 Ant Design Vue 主题合同（可拷进 ln-one-os-web）
 *
 * 事实源：ONEOS-DESIGN.md §1 Token · §4 对等
 * 禁止从原型仓拷贝 React UIComponents / V2Button
 *
 * 硬规矩：
 * 1. Token 只放可解析真值（hex / rgba）。塞 var() 会让 Ant 色彩算法算出黑图标。
 * 2. 不锁品牌主色：colorPrimary 由偏好经 options.tokens 传入。
 *
 * 落点：apps/web-antd/src/utils/oneos-ant-theme.ts
 */
import type { ThemeConfig } from 'ant-design-vue/es/config-provider/context';
import { theme } from 'ant-design-vue';

type AntdTokens = Record<string, unknown>;

const LIGHT = {
  colorText: '#0A2540',
  colorTextHeading: '#0A2540',
  colorTextSecondary: '#425466',
  colorTextTertiary: '#627D98',
  colorTextDescription: '#627D98',
  colorTextPlaceholder: '#657589',
  colorTextDisabled: '#A3AFBD',
  colorBorder: '#DCE3EB',
  colorBorderSecondary: '#EEF2F6',
  colorSplit: '#EEF2F6',
  colorBgLayout: '#F3F5F8',
  colorBgContainer: '#FFFFFF',
  colorBgElevated: '#FFFFFF',
  colorFillAlter: '#F8FAFC',
  colorFillSecondary: '#F1F5F9',
  colorFillTertiary: '#F5F8FA',
  colorFillQuaternary: '#F8FAFC',
  colorSuccess: '#10B981',
  colorWarning: '#D97706',
  colorError: '#EF4444',
  colorInfo: '#3B82F6',
  headerBg: '#F8FAFC',
  hoverBg: '#F1F5F9',
  spotlightBg: '#0A2540',
  hairlineStrong: '#C7D2DD',
  boxShadowElev2: '0 10px 32px rgba(10, 37, 64, 0.10)',
};

const DARK = {
  colorText: '#F7FAFC',
  colorTextHeading: '#F7FAFC',
  colorTextSecondary: '#A0AEC0',
  colorTextTertiary: '#718096',
  colorTextDescription: '#718096',
  colorTextPlaceholder: '#8D9EB2',
  colorTextDisabled: '#4A5568',
  colorBorder: '#23272F',
  colorBorderSecondary: '#1C2028',
  colorSplit: '#1C2028',
  colorBgLayout: '#0A0B0D',
  colorBgContainer: '#121418',
  colorBgElevated: '#16181F',
  colorFillAlter: '#16181F',
  colorFillSecondary: '#1E222D',
  colorFillTertiary: '#191C23',
  colorFillQuaternary: '#16181F',
  colorSuccess: '#10B981',
  colorWarning: '#D97706',
  colorError: '#EF4444',
  colorInfo: '#3B82F6',
  headerBg: '#16181F',
  hoverBg: '#1E222D',
  spotlightBg: '#1E222D',
  hairlineStrong: '#2D3748',
  boxShadowElev2: '0 12px 32px rgba(0, 0, 0, 0.35)',
};

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';

export function buildOneOsAntdTheme(options: {
  isDark: boolean;
  compact: boolean;
  tokens: AntdTokens;
  controlHeight: number;
  borderRadius: number;
}): ThemeConfig {
  const algorithm = options.isDark ? [theme.darkAlgorithm] : [theme.defaultAlgorithm];

  if (options.compact) {
    algorithm.push(theme.compactAlgorithm);
  }

  const radius = options.borderRadius;
  const height = options.controlHeight;
  const s = options.isDark ? DARK : LIGHT;
  const radiusLG = Math.max(radius, 12);

  return {
    algorithm,
    token: {
      ...options.tokens,
      ...s,
      controlHeight: height,
      controlHeightSM: Math.max(height - 8, 24),
      controlHeightLG: height + 4,
      borderRadius: radius,
      borderRadiusLG: radiusLG,
      borderRadiusSM: Math.max(radius - 4, 4),
      fontFamily: FONT_STACK,
      fontSize: 13,
      fontSizeHeading5: 16,
      fontSizeHeading4: 20,
      fontWeightStrong: 600,
      lineHeight: 1.5715,
      lineWidth: 1,
      boxShadow: 'none',
      boxShadowTertiary: 'none',
      boxShadowSecondary: s.boxShadowElev2,
      controlOutlineWidth: 2,
      motionDurationFast: '0.12s',
      motionDurationMid: '0.16s',
      motionDurationSlow: '0.2s',
      motionEaseInOut: 'cubic-bezier(0.2, 0, 0, 1)',
      motionEaseOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
    // Ant Design Vue 4.2 uses AliasToken for most component overrides.
    // React Ant Design 5/6 tokens such as primaryShadow / optionHeight / headerBg
    // are not supported here. Fine presentation lives in scoped patterns.css.
    components: {
      Button: { controlHeight: height, borderRadius: radius, fontSize: 13, fontWeightStrong: 600 },
      Input: { controlHeight: height, borderRadius: radius },
      InputNumber: { controlHeight: height, borderRadius: radius },
      Select: { controlHeight: height, borderRadius: radius, controlItemBgHover: s.hoverBg },
      Cascader: { controlItemBgHover: s.hoverBg },
      DatePicker: { controlHeight: height, borderRadius: radius, controlItemBgHover: s.hoverBg },
      Table: {
        colorFillAlter: s.headerBg,
        colorBorderSecondary: s.colorBorderSecondary,
        fontSize: 13,
      },
      Modal: { borderRadiusLG: radiusLG, colorBgElevated: s.colorBgElevated },
      Drawer: { paddingLG: 20 },
      Dropdown: { borderRadiusLG: radiusLG, controlItemBgHover: s.hoverBg },
      Card: {
        borderRadiusLG: radiusLG,
        paddingLG: 20,
        colorBorderSecondary: s.colorBorderSecondary,
      },
      Form: { colorText: s.colorTextSecondary, colorError: s.colorError, marginLG: 18 },
      Message: { colorBgElevated: s.colorBgElevated, borderRadiusLG: radiusLG },
      Notification: { borderRadiusLG: radiusLG },
      Tooltip: { colorBgSpotlight: s.spotlightBg, borderRadius: 8 },
      Empty: { colorTextDescription: s.colorTextTertiary },
      Tag: { borderRadiusSM: 6, colorFillAlter: s.colorFillAlter },
      Pagination: { borderRadius: radius, controlHeight: 32 },
      Menu: { controlHeightLG: 40, borderRadius: radius },
      Tabs: { fontSize: 13, colorFillAlter: s.colorFillAlter },
      Segmented: { borderRadius: radius, controlHeight: height },
      Steps: { controlHeight: 26 },
      Descriptions: { colorFillAlter: s.headerBg },
      Alert: { borderRadiusLG: radius },
    },
  };
}
