<script lang="ts">
	export let data: { error?: string } | undefined;
</script>

<svelte:head>
	<title>Admin Login | Arc Spirits</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-10 text-white">
	<h1 class="text-2xl font-bold">Admin Login</h1>
	<p class="mt-2 text-sm text-gray-400">Enter the admin secret to manage game verification.</p>

	{#if data?.error}
		<div class="mt-6 rounded-lg border border-red-800 bg-red-900/20 p-4 text-sm text-red-200">
			{data.error}
		</div>
	{/if}

	<form method="POST" class="mt-6 space-y-4">
		<label class="block">
			<span class="text-sm font-semibold text-gray-200">Admin Secret</span>
			<input
				name="secret"
				type="password"
				autocomplete="current-password"
				required
				class="mt-2 w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
			/>
		</label>
		<button
			type="submit"
			class="w-full rounded-md bg-purple-700 px-4 py-2 font-semibold text-white hover:bg-purple-600"
		>
			Sign in
		</button>
	</form>
</main>
