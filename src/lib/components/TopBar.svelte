<script lang="ts">
	import { page } from '$app/stores';

	const activeClass = 'rounded-md bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white';
	const inactiveClass =
		'rounded-md px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200';
</script>

{#if !$page.url.pathname.endsWith('/export')}
	{@const pathname = $page.url.pathname}
	{@const isLeaderboard = pathname.startsWith('/leaderboard')}
	{@const isStats = pathname.startsWith('/stats')}
	{@const isAdmin = pathname.startsWith('/admin')}
	{@const isPlayers = pathname.startsWith('/players')}
	{@const isGames = !isLeaderboard && !isPlayers && !isStats && !isAdmin}
	<header
		class="screen-only sticky top-0 z-50 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm"
	>
		<div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
			<a href="/" class="flex min-w-0 items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-purple-500 to-blue-600"
				>
					<img
						src="/favicon.png"
						alt="Arc Spirits"
						class="h-full w-full object-cover"
						width="40"
						height="40"
						loading="eager"
						decoding="async"
					/>
				</div>
				<div class="min-w-0">
					<div class="truncate text-base font-bold text-gray-100 sm:text-lg">
						Arc Spirits Spectate
					</div>
				</div>
			</a>

			<div class="flex items-center gap-3">
				<nav class="inline-flex shrink-0 rounded-lg bg-gray-800/60 p-1">
					<a
						href="/"
						class={isGames ? activeClass : inactiveClass}
						aria-current={isGames ? 'page' : undefined}
					>
						Game Records
					</a>
					<a
						href="/leaderboard"
						class={isLeaderboard ? activeClass : inactiveClass}
						aria-current={isLeaderboard ? 'page' : undefined}
					>
						Leaderboard
					</a>
					{#if $page.data.isAdmin}
						<a
							href="/stats"
							class={isStats ? activeClass : inactiveClass}
							aria-current={isStats ? 'page' : undefined}
						>
							Stats
						</a>
					{/if}
				</nav>

				{#if $page.data.isAdmin}
					<div class="text-xs font-semibold text-purple-200" title="You are viewing as admin">
						Admin view
					</div>
				{/if}
			</div>
		</div>
	</header>
{/if}
