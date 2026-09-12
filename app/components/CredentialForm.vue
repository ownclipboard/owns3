<script setup lang="ts">
export interface CredentialFormValues {
  name: string
  endpoint: string
  region: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  forcePathStyle: boolean
}

const props = defineProps<{
  initial?: Partial<CredentialFormValues>
  /** Saved credential id; enables testing the stored secret when the secret field is left blank. */
  credentialId?: string
  submitLabel?: string
  saving?: boolean
}>()
const emit = defineEmits<{ submit: [values: CredentialFormValues] }>()

const toast = useToast()
const form = reactive<CredentialFormValues>({
  name: props.initial?.name ?? '',
  endpoint: props.initial?.endpoint ?? '',
  region: props.initial?.region ?? 'auto',
  bucket: props.initial?.bucket ?? '',
  accessKeyId: props.initial?.accessKeyId ?? '',
  secretAccessKey: '',
  forcePathStyle: props.initial?.forcePathStyle ?? true,
})

const testing = ref(false)
const testResult = ref<{ ok: boolean; message: string } | null>(null)

async function test() {
  testing.value = true
  testResult.value = null
  try {
    const body = props.credentialId && !form.secretAccessKey ? { id: props.credentialId } : { ...form }
    if (!('id' in body) && (!body.endpoint || !body.bucket || !body.accessKeyId || !body.secretAccessKey)) {
      throw new Error('Fill in endpoint, bucket, access key ID and secret before testing.')
    }
    testResult.value = await $fetch<{ ok: boolean; message: string }>('/api/admin/credentials/test', { method: 'POST', body })
  } catch (error) {
    testResult.value = { ok: false, message: errorMessage(error) }
  } finally {
    testing.value = false
  }
}

function submit() {
  emit('submit', { ...form })
}
</script>

<template>
  <form class="space-y-5" @submit.prevent="submit">
    <UiInput v-model="form.name" label="Name" placeholder="Production R2" required hint="A label to recognise this credential by." />
    <div class="grid gap-5 sm:grid-cols-2">
      <UiInput
        v-model="form.endpoint"
        label="Endpoint URL"
        placeholder="https://<account-id>.r2.cloudflarestorage.com"
        required
        mono
        hint="For AWS use https://s3.<region>.amazonaws.com"
      />
      <UiInput v-model="form.region" label="Region" placeholder="auto" mono hint="R2 uses “auto”. AWS needs the bucket region, e.g. us-east-1." />
      <UiInput v-model="form.bucket" label="Bucket" placeholder="my-bucket" required mono />
      <UiInput v-model="form.accessKeyId" label="Access key ID" required mono autocomplete="off" />
    </div>
    <UiInput
      v-model="form.secretAccessKey"
      label="Secret access key"
      type="password"
      :required="!credentialId"
      mono
      autocomplete="new-password"
      :hint="credentialId ? 'Leave blank to keep the current secret. Stored encrypted with SECRET_KEY.' : 'Stored encrypted with SECRET_KEY and never shown again.'"
    />
    <UiCheckbox v-model="form.forcePathStyle" label="Use path-style URLs" hint="Recommended for R2, MinIO and most S3-compatible providers. Turn off for virtual-hosted style (bucket.endpoint)." />

    <div
      v-if="testResult"
      class="rounded-lg border px-4 py-3 text-sm"
      :class="testResult.ok ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'"
    >
      {{ testResult.message }}
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
      <UiButton variant="secondary" :loading="testing" @click="test">Test connection</UiButton>
      <div class="flex gap-2">
        <slot name="actions" />
        <UiButton type="submit" :loading="saving">{{ submitLabel ?? 'Save credential' }}</UiButton>
      </div>
    </div>
  </form>
</template>
