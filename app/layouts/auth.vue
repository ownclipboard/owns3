<template>
  <div class="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <img src="/logos/lockup.svg" alt="Owns3" width="248" height="60" class="mx-auto h-12 w-auto" />
        <p class="mt-3 text-sm text-zinc-500">Share your S3 storage without sharing your credentials.</p>
      </div>
      <slot />
    </div>
  </div>
</template>
