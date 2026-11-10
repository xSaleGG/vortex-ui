<script lang="ts">
	import { dashboard, lang, history, historyIndex, record, ripple, entityList } from '$lib/Stores';
	import { onDestroy, tick } from 'svelte';
	import Select from '$lib/Components/Select.svelte';
	import ConfigButtons from '$lib/Modal/ConfigButtons.svelte';
	import VisibilityItemButton from '$lib/Main/VisibilityItemButton.svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import { updateObj } from '$lib/Utils';
	import Ripple from 'svelte-ripple';
	import Icon from '@iconify/svelte';
	import Camera from '$lib/Main/Camera.svelte';
	import type { DoorbellAction, DoorbellItem } from '$lib/Types';

	export let isOpen: boolean;
	export let sel: DoorbellItem;

	function set(key: string, event?: any) {
		sel = updateObj(sel, key, event) as DoorbellItem;
		$dashboard = $dashboard;
	}

	$: cameraOptions = $entityList('camera');
	$: allOptions = $entityList('');
	$: triggerOptions = $entityList('binary_sensor');
	let actions: DoorbellAction[] = [];
	$: actions = getActions(sel);

	function getActions(item: DoorbellItem): DoorbellAction[] {
		if (item.actions?.length) return item.actions;
		return item.action_entity ? [{ entity_id: item.action_entity }] : [];
	}

	function setActions(actions: DoorbellAction[]) {
		sel = updateObj(sel, 'actions', actions) as DoorbellItem;
		delete sel.action_entity;
		$dashboard = $dashboard;
	}

	function updateAction(index: number, patch: Partial<DoorbellAction>) {
		const next = [...actions];
		next[index] = { ...next[index], ...patch };
		setActions(next);
	}

	function addAction() {
		setActions([...actions, { entity_id: undefined, name: '' }]);
	}

	function removeAction(index: number) {
		setActions(actions.filter((_, actionIndex) => actionIndex !== index));
	}

	let actionSelectWidth = 0;
	let actionSelectTop = 0;
	let actionSelectLeft = 0;

	async function positionActionSelect(event: FocusEvent) {
		const actionRow = event.currentTarget as HTMLElement;
		await tick();
		const row = actionRow.getBoundingClientRect();
		const entitySelect = actionRow.querySelector('.container')?.getBoundingClientRect();
		actionSelectTop = row.bottom + 4;
		actionSelectLeft = entitySelect?.left ?? row.left;
		actionSelectWidth = entitySelect?.width ?? row.width;
	}

	function handleActionField(index: number, field: 'name' | 'icon', event: Event) {
		const value = (event.currentTarget as HTMLInputElement).value;
		const normalized = value.trim() ? value : undefined;
		if (field === 'name') updateAction(index, { name: normalized });
		else updateAction(index, { icon: normalized });
	}

	function setTriggerTimeout(event: Event) {
		const v = parseInt((event.target as HTMLInputElement).value);
		set('trigger_timeout', isNaN(v) ? undefined : v);
	}

	onDestroy(() => $record());
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">{$lang('doorbell') || 'Doorbell'}</h1>

		<!-- camera preview -->
		{#if sel?.camera_entity}
			<h2>{$lang('preview')}</h2>
			<Camera
				sel={{ ...sel, entity_id: sel.camera_entity }}
				responsive={true}
				muted={true}
				controls={false}
			/>
		{/if}

		<!-- camera entity -->
		<h2>{$lang('camera')}</h2>
		<Select
			computeIcons={true}
			options={cameraOptions}
			placeholder={$lang('camera')}
			value={sel?.camera_entity}
			on:change={(e) => set('camera_entity', e)}
		/>

		<!-- live stream -->
		<h2>{$lang('live')}</h2>
		<div class="button-container">
			<button class:selected={!sel?.stream} on:click={() => set('stream')} use:Ripple={$ripple}>
				{$lang('no')}
			</button>
			<button
				class:selected={sel?.stream === true}
				on:click={() => set('stream', true)}
				use:Ripple={$ripple}
			>
				{$lang('yes')}
			</button>
		</div>

		<!-- configurable modal actions -->
		<h2>{$lang('doorbell_actions') || 'Actions'}</h2>
		<div class="actions-list">
			{#each actions as action, index (index)}
				<div
					class="action-row"
					on:focusin={positionActionSelect}
					style="--select-top: {actionSelectTop}px; --select-left: {actionSelectLeft}px; --select-width: {actionSelectWidth}px"
				>
					<Select
						computeIcons={true}
						clearable={true}
						options={allOptions}
						placeholder={$lang('entity')}
						value={action.entity_id}
						on:change={(event) => updateAction(index, { entity_id: event.detail })}
					/>
					<input
						class="input action-label"
						value={action.name ?? ''}
						placeholder={$lang('run') || 'Run'}
						aria-label={$lang('action_label') || $lang('name')}
						on:change={(event) => handleActionField(index, 'name', event)}
					/>
					<input
						class="input action-icon"
						value={action.icon ?? ''}
						placeholder={$lang('icon')}
						aria-label={$lang('icon')}
						autocomplete="off"
						spellcheck="false"
						on:change={(event) => handleActionField(index, 'icon', event)}
					/>
					<button
						class="remove-action"
						type="button"
						title={$lang('remove')}
						aria-label={$lang('remove')}
						on:click={() => removeAction(index)}
						use:Ripple={{ ...$ripple, color: 'rgba(255,80,80,0.3)' }}
					>
						<Icon icon="mingcute:close-fill" height="0.9rem" />
					</button>
				</div>
			{/each}
		</div>
		<button class="add-action" type="button" on:click={addAction} use:Ripple={$ripple}>
			<Icon icon="mdi:plus" height="1.1rem" />
			{$lang('add')}
		</button>

		<!-- trigger entity -->
		<h2>{$lang('trigger_entity') || 'Trigger entity'}</h2>
		<Select
			computeIcons={true}
			options={triggerOptions}
			placeholder={$lang('trigger_entity') || 'Trigger entity'}
			value={sel?.trigger_entity}
			on:change={(e) => set('trigger_entity', e)}
		/>

		<!-- auto-close timeout -->
		{#if sel?.trigger_entity}
			<h2>{$lang('trigger_timeout')} ({$lang('seconds')?.toLowerCase()})</h2>
			<input
				class="input"
				type="number"
				min="5"
				max="300"
				placeholder="30"
				value={sel?.trigger_timeout ?? ''}
				on:change={setTriggerTimeout}
			/>
		{/if}

		<!-- visibility -->
		<h2>{$lang('visibility')}</h2>
		<div style="display: flex; gap: 0.8rem;">
			<VisibilityItemButton item={sel} />
		</div>

		<ConfigButtons {sel} />
	</Modal>
{/if}

<style>
	h2:first-letter {
		text-transform: uppercase;
	}

	.input {
		width: 100%;
		box-sizing: border-box;
	}

	.actions-list {
		display: grid;
		gap: 0.6rem;
	}

	.action-row {
		display: grid;
		grid-template-columns: minmax(5rem, 1.5fr) minmax(5rem, 1.2fr) minmax(5rem, 0.8fr) auto;
		align-items: center;
		gap: 0.4rem;
	}

	.action-row :global(.container) {
		min-width: 0;
	}

	.action-row :global(.wrapper) {
		position: fixed;
		z-index: 1000;
		top: var(--select-top);
		left: var(--select-left);
		width: var(--select-width);
	}

	.action-label,
	.action-icon {
		min-width: 0;
	}

	.remove-action,
	.add-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		color: inherit;
		border: 0;
		border-radius: 0.4rem;
		cursor: pointer;
	}

	.remove-action {
		padding: 0.4rem;
		background: transparent;
		opacity: 0.65;
	}

	.remove-action:hover {
		background: rgba(255, 80, 80, 0.2);
		opacity: 1;
	}

	.add-action {
		margin-top: 0.6rem;
		padding: 0.5rem 0.75rem;
		background: var(--theme-button-background-color-off);
		font: inherit;
	}
</style>
