<script lang="ts">
	import { states, editMode, motion, lang } from '$lib/Stores';
	import { openModal } from 'svelte-modals';
	import { getPowerSummaryResults, type PowerSummaryResult } from '$lib/PowerSummary';
	import Icon from '@iconify/svelte';
	import type { PowerSummaryItem } from '$lib/Types';

	export let sel: PowerSummaryItem | undefined = undefined;
	export let demo = false;
	export let preview = false;

	// Demo data shown in the config modal preview
	const demoResults: PowerSummaryResult[] = [
		{
			group: { label: 'Lights', icon: 'mdi:lightbulb' } as any,
			count: 3,
			total: 8,
			displayText: '',
			entities: []
		},
		{
			group: { label: 'Devices', icon: 'mdi:television' } as any,
			count: 0,
			total: 4,
			displayText: '',
			entities: []
		}
	];

	$: results = demo ? demoResults : getPowerSummaryResults(sel?.groups ?? [], $states);

	function handleGroupClick(result: PowerSummaryResult) {
		if (preview) return;
		if ($editMode) {
			if (sel) openModal(() => import('$lib/Modal/PowerSummaryConfig.svelte'), { sel });
			return;
		}
		if (demo) return;

		openModal(() => import('$lib/Modal/PowerSummaryDetails.svelte'), {
			group: result.group,
			entityIds: result.entities.map((entity) => entity.entity_id),
			columns: sel?.detail_columns ?? 1
		});
	}
</script>

{#if sel?.groups?.length || demo || $editMode}
	<div
		class="container"
		style:padding="var(--theme-sidebar-item-padding)"
		style:display="flex"
		style:flex-direction="column"
		style:gap="0.4rem"
	>
		{#each results as { group, count, displayText, entities }}
			<button
				type="button"
				class="group-row"
				on:click={() => handleGroupClick({ group, count, total: entities.length, displayText, entities })}
				style:opacity={count === 0 && !$editMode ? '0.3' : '1'}
				style:transition="opacity {$motion}ms ease"
			>
				<span class="group-icon">
					<Icon icon={group.icon || 'mdi:circle-small'} height="1em" width="1em" />
				</span>

				<div class="group-body">
					{#if group.label}
						<span class="group-label">{group.label}</span>
					{/if}
					{#if displayText}
						<span class="group-text">{displayText}</span>
					{/if}
				</div>

				{#if count > 0 || $editMode}
					<span class="badge" class:badge-zero={count === 0}>{count}</span>
				{/if}
			</button>
		{/each}

		{#if $editMode && (!sel?.groups || sel.groups.length === 0)}
			<span class="placeholder">{$lang('power_summary')}</span>
		{/if}
	</div>
{/if}

<style>
	.container {
		text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
	}

	.group-row {
		width: 100%;
		background-color: rgba(0, 0, 0, 0.2);
		border-radius: 0.6rem;
		padding: 0.5rem 0.75rem;
		border: 0;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.group-row:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}

	.group-row:hover {
		background-color: rgba(0, 0, 0, 0.3);
	}

	.group-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		font-size: 1.2rem;
		width: 1.2rem;
		color: rgba(255, 255, 255, 0.75);
	}

	.group-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}

	.group-label {
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.group-text {
		font-size: 0.95rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.badge {
		flex-shrink: 0;
		background: var(--theme-colors-sidebar-item-background, rgba(255, 255, 255, 0.15));
		border-radius: 999px;
		padding: 0 0.5rem;
		font-size: 0.75rem;
		font-weight: 700;
		min-width: 1.4rem;
		text-align: center;
		color: var(--theme-colors-sidebar-font-color, inherit);
	}

	.badge-zero {
		opacity: 0.4;
	}

	.placeholder {
		color: rgba(255, 255, 255, 0.25);
		font-size: 0.9rem;
		padding: 0.5rem 0.75rem;
	}
</style>
