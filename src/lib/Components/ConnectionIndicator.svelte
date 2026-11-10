<script lang="ts">
	import { connected, demoMode, motion, lang } from '$lib/Stores';
	import { fade } from 'svelte/transition';
	import { onDestroy } from 'svelte';

	let hasConnectedOnce = false;
	let showBanner = false;
	let delayTimeout: ReturnType<typeof setTimeout> | undefined;

	$: if ($connected === true) {
		hasConnectedOnce = true;
		clearTimeout(delayTimeout);
		showBanner = false;
	} else if ($connected === false && hasConnectedOnce) {
		clearTimeout(delayTimeout);
		delayTimeout = setTimeout(() => {
			showBanner = true;
		}, 2000);
	}

	onDestroy(() => clearTimeout(delayTimeout));
</script>


{#if $demoMode}
	<div class="banner demo-banner">Offline demo mode - Home Assistant URL not configured</div>
{:else if showBanner}
	<div class="banner" transition:fade={{ duration: $motion }}>
		{$lang('connection_lost')}
	</div>
{/if}

<style>
	.banner {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 4;
		padding: 0.5rem;
		text-align: center;
		background: var(--theme-colors-danger, rgba(174, 46, 46, 0.9));
		color: var(--theme-colors-text, white);
		font-size: 0.9rem;
		text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2);
	}

	.demo-banner {
		background: var(--theme-colors-success, rgba(42, 105, 83, 0.94));
	}
</style>
