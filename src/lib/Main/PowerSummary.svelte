<script lang="ts">
	import { editMode, itemHeight, lang, states } from '$lib/Stores';
	import { openModal } from 'svelte-modals';
	import Icon from '@iconify/svelte';
	import { getPowerSummaryResults } from '$lib/PowerSummary';
	import type { PowerSummaryItem } from '$lib/Types';
	import type { PowerSummaryResult } from '$lib/PowerSummary';

	export let sel: PowerSummaryItem;

	$: results = getPowerSummaryResults(sel?.groups ?? [], $states);

	function configure() {
		openModal(() => import('$lib/Modal/PowerSummaryConfig.svelte'), { sel });
	}

	function handleGroupClick(result: PowerSummaryResult) {
		if ($editMode) {
			configure();
			return;
		}

		openModal(() => import('$lib/Modal/PowerSummaryDetails.svelte'), {
			group: result.group,
			entityIds: result.entities.map((entity) => entity.entity_id),
			columns: sel.detail_columns ?? 1
		});
	}
</script>

<div class="summary-grid">
	{#each results as result}
		<button
			type="button"
			class:active={result.count > 0}
			style:height="{$itemHeight}px"
		on:click={() => handleGroupClick(result)}
		>
			<span class="group-icon">
				<Icon icon={result.group.icon || 'mdi:circle-small'} height="1.5rem" width="1.5rem" />
			</span>
			<span class="label">{result.group.label || $lang('power_summary')}</span>
			<span class="count">
				<strong>{result.count}</strong><span>/{result.total}</span>
			</span>
			<span class="caption">{$lang('active')}</span>
		</button>
	{/each}
	{#if results.length === 0 && $editMode}
		<button class="empty" type="button" style:height="{$itemHeight}px" on:click={configure}>
			<Icon icon="mdi:plus" height="1.3rem" width="1.3rem" />
			{$lang('power_summary')}
		</button>
	{/if}
</div>

<style>
	.summary-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
		gap: 0.5rem;
		width: 100%;
		min-width: 0;
	}

	.summary-grid button {
		position: relative;
		display: grid;
		grid-template-columns: auto 1fr;
		grid-template-areas:
			'icon label'
			'icon count';
		align-content: center;
		align-items: center;
		column-gap: 0.75rem;
		row-gap: 0.08rem;
		min-width: 0;
		min-height: 0;
		padding: 0.4rem 0.75rem;
		border: 0;
		border-radius: var(--theme-border-radius-card, 0.6rem);
		background: var(--theme-button-background-color-off);
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.summary-grid button:hover {
		filter: brightness(1.08);
	}

	.summary-grid button:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}

	.summary-grid button.active .group-icon,
	.summary-grid button.active .count strong {
		color: var(--theme-button-icon-color-on, var(--theme-colors-accent, #e6b45c));
	}

	.group-icon {
		grid-area: icon;
		display: flex;
		align-items: center;
		color: var(--theme-button-icon-color-off, currentColor);
	}

	.label {
		grid-area: label;
		min-width: 0;
		overflow: hidden;
		font-size: 0.82rem;
		font-weight: 600;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.count {
		grid-area: count;
		display: flex;
		align-items: baseline;
		gap: 0.12rem;
		font-variant-numeric: tabular-nums;
	}

	.count strong {
		font-size: 1.35rem;
		line-height: 1;
	}

	.count span {
		font-size: 0.9rem;
		opacity: 0.65;
	}

	.caption {
		display: none;
		font-size: 0.68rem;
		opacity: 0.62;
	}

	.empty {
		display: flex !important;
		align-items: center;
		justify-content: center;
		gap: 0.5rem !important;
		border: 1px dashed currentColor !important;
		background: transparent !important;
		opacity: 0.7;
	}
</style>