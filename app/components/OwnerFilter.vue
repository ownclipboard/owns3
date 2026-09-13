<script setup lang="ts">
/** Admin-only owner selector: all owners, the administrator, or one user. Value: '' | 'admin' | userId */
const model = defineModel<string>({ default: '' })
defineProps<{ users: { id: string; username: string }[] }>()
</script>

<template>
  <UiSelect
    v-model="model"
    label="Owner"
    :options="[{ value: 'admin', label: 'Administrator' }, ...users.map((u) => ({ value: u.id, label: u.username }))]"
    placeholder="All owners"
  />
</template>
