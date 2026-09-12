<script setup lang="ts">
export interface AppFormValues {
  name: string
  slug: string
  description: string
  credentialId: string
  folder: string
}

const props = defineProps<{
  initial?: Partial<AppFormValues>
  credentials: { id: string; name: string; bucket: string }[]
  submitLabel?: string
  saving?: boolean
}>()
const emit = defineEmits<{ submit: [values: AppFormValues] }>()

const form = reactive<AppFormValues>({
  name: props.initial?.name ?? '',
  slug: props.initial?.slug ?? '',
  description: props.initial?.description ?? '',
  credentialId: props.initial?.credentialId ?? '',
  folder: props.initial?.folder ?? '',
})

const slugTouched = ref(!!props.initial?.slug)
function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
watch(
  () => form.name,
  (name) => {
    if (!slugTouched.value) form.slug = slugify(name)
  },
)

const credentialOptions = computed(() => props.credentials.map((c) => ({ value: c.id, label: `${c.name} · ${c.bucket}` })))
</script>

<template>
  <form class="space-y-5" @submit.prevent="emit('submit', { ...form })">
    <div class="grid gap-5 sm:grid-cols-2">
      <UiInput v-model="form.name" label="Name" placeholder="My Blog" required />
      <UiInput v-model="form.slug" label="Slug" placeholder="my-blog" mono hint="Lowercase letters, numbers and dashes." @input="slugTouched = true" />
    </div>
    <UiTextarea v-model="form.description" label="Description" placeholder="What is this app? (optional)" :rows="2" />
    <UiSelect
      v-model="form.credentialId"
      label="S3 credential"
      :options="credentialOptions"
      placeholder="Select a credential"
      required
      hint="The bucket this app will read from and write to."
    />
    <UiInput
      v-model="form.folder"
      label="Folder"
      placeholder="blog/uploads"
      mono
      hint="Optional key prefix inside the bucket. The app can only access objects under this folder. Leave blank for the whole bucket."
    />
    <div class="flex justify-end gap-2 pt-2">
      <slot name="actions" />
      <UiButton type="submit" :loading="saving">{{ submitLabel ?? 'Save app' }}</UiButton>
    </div>
  </form>
</template>
