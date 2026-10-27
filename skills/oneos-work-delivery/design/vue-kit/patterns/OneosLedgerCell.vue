<script setup lang="ts">
defineProps<{
  primary?: string | number | null;
  secondary?: string | number | null;
  primaryNumber?: boolean;
  secondaryNumber?: boolean;
}>();
</script>

<template>
  <div class="oneos-ledger-cell">
    <div
      class="oneos-ledger-cell__primary"
      :class="{ 'oneos-number': primaryNumber }"
      :title="primary == null ? undefined : String(primary)"
    >
      <slot>{{ primary }}</slot>
    </div>
    <div
      v-if="$slots.secondary || (secondary !== null && secondary !== undefined && secondary !== '')"
      class="oneos-ledger-cell__secondary"
      :class="{ 'oneos-number': secondaryNumber }"
      :title="secondary == null ? undefined : String(secondary)"
    >
      <slot name="secondary">{{ secondary }}</slot>
    </div>
  </div>
</template>
