<template>
  <div class="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">S3</div>
        <h1 class="text-2xl font-semibold tracking-tight text-zinc-900">Owns3</h1>
        <p class="mt-1 text-sm text-zinc-500">Share your S3 storage without sharing your credentials.</p>
      </div>
      <slot />
    </div>
  </div>
</template>
