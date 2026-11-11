<script lang="ts">
	import { dashboard, editMode, record } from '$lib/Stores';
	import { modals } from 'svelte-modals';
	import Icon from '@iconify/svelte';

	export let item: any;
	export let columns: number;
	export let span: number;

	function resize(delta: number) {
		item.grid_span = Math.min(columns, Math.max(1, span + delta));
		$dashboard = $dashboard;
		$record();
	}
</script>

{#if $editMode && $modals.length === 0}
	<div class="resize-controls">
		<button
			type="button"
			aria-label="Schmaler"
			title="Schmaler"
			disabled={span <= 1}
			on:click|stopPropagation={() => resize(-1)}
		>
			<Icon icon="mdi:minus" height="1rem" width="1rem" />
		</button>
		<button
			type="button"
			aria-label="Breiter"
			title="Breiter"
			disabled={span >= columns}
			on:click|stopPropagation={() => resize(1)}
		>
			<Icon icon="mdi:plus" height="1rem" width="1rem" />
		</button>
	</div>
{/if}

<style>
	.resize-controls {
		position: absolute;
		top: 0.2rem;
		right: 0.2rem;
		z-index: 2;
		display: flex;
		gap: 0.15rem;
		padding: 0.15rem;
		border-radius: 0.4rem;
		background: var(--theme-button-background-color-off);
	}

	button {
		display: grid;
		place-items: center;
		width: 1.65rem;
		height: 1.65rem;
		padding: 0;
		border: 0;
		border-radius: 0.3rem;
		background: var(--theme-colors-surface, rgba(0, 0, 0, 0.2));
		color: inherit;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.35;
		cursor: unset;
	}
</style>
