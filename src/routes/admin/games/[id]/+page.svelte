<script lang="ts">
	type PlayerRow = {
		game_id: string;
		verified: boolean;
		started_at: string | null;
		ended_at: string | null;
		navigation_count: number;
		player_color: string;
		username: string | null;
		raw_username: string | null;
		selected_character: string;
		victory_points: number;
		placement: number;
		player_count: number;
		tags: string[];
	};

	export let data: {
		gameId: string;
		players: PlayerRow[];
		configError: string | null;
		tagOptions: string[];
	};

	function formatTimestamp(timestamp: string | null): string {
		if (!timestamp) return '—';
		const date = new Date(timestamp);
		if (Number.isNaN(date.getTime())) return String(timestamp);
		return date.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}
</script>

<svelte:head>
	<title>Admin Tags | Arc Spirits</title>
</svelte:head>

<main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8 text-white">
	<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="min-w-0">
			<a href="/admin/games" class="text-sm font-semibold text-purple-300 hover:text-purple-200"
				>← Admin Games</a
			>
			<h1 class="mt-2 truncate text-xl font-bold text-gray-100">Admin · Tags</h1>
			<p class="mt-1 text-sm text-gray-400">
				Game <span class="font-semibold text-gray-200">{data.gameId}</span>
			</p>
		</div>
		<div class="flex items-center gap-2">
			<a
				href={`/game/${encodeURIComponent(data.gameId)}`}
				class="rounded-md bg-gray-800 px-3 py-1.5 text-sm font-semibold text-gray-100 hover:bg-gray-700"
			>
				View Game
			</a>
			<a
				href="/admin/logout"
				class="rounded-md bg-gray-800 px-3 py-1.5 text-sm font-semibold text-gray-100 hover:bg-gray-700"
			>
				Log out
			</a>
		</div>
	</div>

	{#if data.configError}
		<div
			class="mb-6 rounded-lg border border-yellow-800 bg-yellow-900/20 p-4 text-sm text-yellow-200"
		>
			{data.configError}
		</div>
	{/if}

	{#if data.players.length === 0}
		<div
			class="rounded-lg border border-gray-800 bg-gray-900/40 p-6 text-center text-sm text-gray-400"
		>
			No players found for this game.
		</div>
	{:else}
		<datalist id="composition-tag-options">
			{#each data.tagOptions ?? [] as option (option)}
				<option value={option}></option>
			{/each}
		</datalist>

		<div class="overflow-x-auto rounded-lg border border-gray-800 bg-gray-900/40">
			<table class="w-full min-w-[980px] text-left text-sm">
				<thead class="border-b border-gray-800 text-xs tracking-wide text-gray-400 uppercase">
					<tr>
						<th class="px-4 py-3">Player</th>
						<th class="px-4 py-3">Character</th>
						<th class="px-4 py-3">Ended</th>
						<th class="px-4 py-3">VP</th>
						<th class="px-4 py-3">Place</th>
						<th class="px-4 py-3">Tags</th>
						<th class="px-4 py-3 text-right">Add Tag</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-800">
					{#each data.players as p (p.player_color)}
						<tr class="hover:bg-gray-900/60">
							<td class="px-4 py-3">
								<div class="font-semibold text-gray-100">
									{p.username ?? p.raw_username ?? 'Unknown'}
								</div>
								<div class="mt-1 text-xs text-gray-500">
									{p.player_color} • {p.verified ? 'Verified' : 'Unverified'} • {p.navigation_count} rounds
								</div>
							</td>
							<td class="px-4 py-3 text-gray-200">{p.selected_character}</td>
							<td class="px-4 py-3 text-gray-300">{formatTimestamp(p.ended_at)}</td>
							<td class="px-4 py-3 text-gray-200">{p.victory_points}</td>
							<td class="px-4 py-3 text-gray-200">{p.placement} / {p.player_count}</td>
							<td class="px-4 py-3">
								{#if p.tags.length === 0}
									<span class="text-xs text-gray-500">—</span>
								{:else}
									<div class="flex flex-wrap gap-2">
										{#each p.tags as tag (tag)}
											<form method="POST" action="?/removeTag" class="inline-flex">
												<input type="hidden" name="playerColor" value={p.player_color} />
												<input type="hidden" name="tag" value={tag} />
												<button
													type="submit"
													class="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900/50 px-2.5 py-1 text-xs font-semibold text-gray-200 hover:border-red-600/60 hover:text-red-200"
													title="Remove tag"
												>
													<span class="truncate">{tag}</span>
													<span class="text-gray-500">×</span>
												</button>
											</form>
										{/each}
									</div>
								{/if}
							</td>
							<td class="px-4 py-3">
								<form method="POST" action="?/addTag" class="flex items-center justify-end gap-2">
									<input type="hidden" name="playerColor" value={p.player_color} />
									<input
										name="tag"
										list="composition-tag-options"
										placeholder="e.g. astral mages"
										class="w-56 rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:border-purple-500 focus:outline-none"
									/>
									<button
										type="submit"
										class="rounded-md bg-purple-700 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-600"
									>
										Add
									</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<div class="mt-6 text-xs text-gray-500">
		Tags are stored lowercased and trimmed, and stats pages use verified games only.
	</div>
</main>
