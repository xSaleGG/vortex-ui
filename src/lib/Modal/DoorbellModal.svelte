<script lang="ts">
	import { connection, states, lang } from '$lib/Stores';
	import Modal from '$lib/Modal/Index.svelte';
	import Camera from '$lib/Main/Camera.svelte';
	import Icon from '@iconify/svelte';
	import { callService } from 'home-assistant-js-websocket';
	import { getDomain } from '$lib/Utils';
	import { onMount, onDestroy } from 'svelte';
	import { closeModal } from 'svelte-modals';
	import type { DoorbellAction, DoorbellItem } from '$lib/Types';

	export let isOpen: boolean;
	export let sel: DoorbellItem;
	export let autoClose = false;

	let actions: DoorbellAction[] = [];
	$: actions = getActions(sel);

	function getActions(item: DoorbellItem): DoorbellAction[] {
		if (item.actions?.length) return item.actions.filter((action) => action.entity_id);
		return item.action_entity ? [{ entity_id: item.action_entity }] : [];
	}

	let countdown: number | null = null;
	let countdownTimer: ReturnType<typeof setInterval> | null = null;

	function startCountdown() {
		if (!sel?.trigger_timeout || sel.trigger_timeout <= 0) return;
		countdown = sel.trigger_timeout;
		countdownTimer = setInterval(() => {
			if (countdown === null) return;
			countdown--;
			if (countdown <= 0) {
				closeModal();
			}
		}, 1000);
	}

	function stopCountdown() {
		if (countdownTimer) {
			clearInterval(countdownTimer);
			countdownTimer = null;
		}
		countdown = null;
	}

	onMount(() => {
		if (autoClose) startCountdown();
	});

	onDestroy(() => stopCountdown());

	$: if (!isOpen) stopCountdown();

	function getActionLabel(action: DoorbellAction): string {
		return action.name?.trim() || $lang('run') || 'Run';
	}

	function getActionIcon(action: DoorbellAction): string {
		if (action.icon) return action.icon;
		switch (getDomain(action.entity_id)) {
			case 'lock':
				return 'mdi:lock-open-outline';
			case 'cover':
				return 'mdi:garage-open';
			case 'script':
				return 'mdi:play';
			default:
				return 'mdi:door-open';
		}
	}

	async function handleAction(action: DoorbellAction) {
		if (!$connection || !action.entity_id) return;
		const domain = getDomain(action.entity_id);
		if (!domain) return;

		let service: string;
		switch (domain) {
			case 'lock':
				service = 'unlock';
				break;
			case 'button':
			case 'input_button':
				service = 'press';
				break;
			case 'cover':
				service = 'open_cover';
				break;
			case 'script':
				service = 'turn_on';
				break;
			case 'switch':
			case 'input_boolean':
				service = 'turn_on';
				break;
			default:
				service = 'turn_on';
		}

		await callService($connection, domain, service, { entity_id: action.entity_id });
	}
</script>

{#if isOpen}
	<Modal size="large">
		<svelte:fragment slot="title">
			<span class="title-row">
				<Icon icon="mdi:doorbell" height="1.1em" />
				{sel?.name || $lang('doorbell') || 'Doorbell'}
			</span>
			{#if countdown !== null}
				<span class="countdown">{countdown}s</span>
			{/if}
		</svelte:fragment>

		<div class="modal-content">
			<div class="camera-wrap">
				<Camera
					sel={{ ...sel, entity_id: sel?.camera_entity, size: 'contain' }}
					responsive={true}
					muted={false}
					controls={true}
				/>
			</div>

			{#if actions.length > 0}
				<div class="actions">
					{#each actions as action, index (`${action.entity_id}-${index}`)}
						<button class="action-btn" on:click={() => handleAction(action)}>
							<Icon icon={getActionIcon(action)} height="1.4em" />
							<span>{getActionLabel(action)}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</Modal>
{/if}

<style>
	.title-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex: 1;
	}

	.countdown {
		font-size: 0.85rem;
		opacity: 0.5;
		font-weight: 400;
		margin-left: auto;
		padding-right: 0.5rem;
	}

	.modal-content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.5rem 0;
	}

	.camera-wrap {
		position: relative;
		border-radius: 0.5rem;
		overflow: hidden;
		height: calc(85vh - 14rem);
		min-height: 50px;
		width: 100%;
		background: black;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.camera-wrap :global(button) {
		width: fit-content !important;
		height: 100% !important;
		max-width: 100% !important;
		padding: 0 !important;
		border: none !important;
		background: black !important;
		display: flex !important;
		align-items: center !important;
		justify-content: center !important;
	}

	.camera-wrap :global(video) {
		width: auto !important;
		height: 100% !important;
		max-width: 100% !important;
		object-fit: contain !important;
	}

	.actions {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
		gap: 0.5rem;
		width: 100%;
	}

	.action-btn {
		min-width: 0;
		min-height: 3.2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		padding: 0.9rem;
		border-radius: 0.75rem;
		border: none;
		background: var(--theme-navigate-background-color, rgba(255, 255, 255, 0.15));
		color: inherit;
		font-size: 1.05rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 150ms ease;
		white-space: normal;
		flex-shrink: 0;
	}

	.action-btn:hover {
		opacity: 0.8;
	}

	.action-btn:active {
		opacity: 0.6;
	}

	/* Tablet portrait (Galaxy Tab A7 Lite and similar: 800x1280) */
	@media (max-width: 1024px) {
		.camera-wrap {
			height: calc(80vh - 12rem);
		}

		.modal-content {
			gap: 0.6rem;
		}
	}

	/* Mobile phones */
	@media (max-width: 768px) {
		.camera-wrap {
			height: calc(75vh - 11rem);
		}

		.modal-content {
			gap: 0.5rem;
			padding: 0;
		}

		.action-btn {
			padding: 0.8rem;
			font-size: 0.95rem;
		}
	}

	/* FHD monitors (1366px – 1919px) — modal max-height drops to 80vh */
	@media (min-width: 1366px) and (max-width: 1919px) {
		.camera-wrap {
			height: calc(80vh - 11rem);
		}
	}

	/* QHD / 4K displays (≥ 1920px) — modal max-height drops to 75vh, extra padding */
	@media (min-width: 1920px) {
		.camera-wrap {
			height: calc(75vh - 13rem);
		}
	}
</style>
