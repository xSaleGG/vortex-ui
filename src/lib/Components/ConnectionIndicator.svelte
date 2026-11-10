<script lang="ts">
	import { connected, demoMode, motion, lang } from '$lib/Stores';
	import { fade } from 'svelte/transition';
	import { onDestroy, onMount } from 'svelte';
	import Icon from '@iconify/svelte';

	let hasConnectedOnce = false;
	let showBanner = false;
	let demoBannerDismissed = true;
	let delayTimeout: ReturnType<typeof setTimeout> | undefined;

	onMount(() => {
		demoBannerDismissed = localStorage.getItem('vortex-demo-banner-dismissed') === 'true';
	});

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

	function dismissDemoBanner() {
		localStorage.setItem('vortex-demo-banner-dismissed', 'true');
		demoBannerDismissed = true;
	}
</script>

{#if $demoMode && !demoBannerDismissed}
	<div class="banner demo-banner" transition:fade={{ duration: $motion }}>
		<span>Offline demo mode - Home Assistant URL not configured</span>
		<button
			class="dismiss-demo"
			type="button"
			aria-label="Dismiss demo notice"
			on:click={dismissDemoBanner}
		>
			<Icon icon="mingcute:close-fill" height="none" />
		</button>
	</div>
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
		padding-right: 2.75rem;
	}

	.dismiss-demo {
		position: absolute;
		top: 50%;
		right: 0.65rem;
		transform: translateY(-50%);
		display: grid;
		place-items: center;
		width: 1.75rem;
		height: 1.75rem;
		padding: 0;
		border: 1px solid currentColor;
		border-radius: var(--theme-border-radius-button, 0.4rem);
		background: transparent;
		color: inherit;
		cursor: pointer;
	}

	.dismiss-demo :global(svg) {
		width: 1rem;
		height: 1rem;
	}
</style>
