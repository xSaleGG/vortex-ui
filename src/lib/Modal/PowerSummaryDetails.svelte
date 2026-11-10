<script lang="ts">
	import { lang, states } from '$lib/Stores';
	import Modal from '$lib/Modal/Index.svelte';
	import { getName } from '$lib/Utils';
	import Icon from '@iconify/svelte';
	import type { HassEntity } from 'home-assistant-js-websocket';
	import type { PowerSummaryGroup } from '$lib/Types';

	export let isOpen: boolean;
	export let group: PowerSummaryGroup;
	export let entityIds: string[];
	export let columns: 1 | 2 | 3 | 4 = 1;

	$: entities = entityIds
		.map((entityId) => $states?.[entityId])
		.filter((entity): entity is HassEntity => Boolean(entity))
		.sort((a, b) => (getName(undefined, a) || '').localeCompare(getName(undefined, b) || ''));

	function isContact(entity: HassEntity) {
		const deviceClass = entity.attributes?.device_class;
		return (
			deviceClass === 'door' ||
			deviceClass === 'window' ||
			/fenster|tuer|door|window/i.test(entity.entity_id)
		);
	}

	function stateLabel(entity: HassEntity) {
		if (isContact(entity) && ['on', 'off'].includes(entity.state)) {
			return entity.state === 'on' ? 'Offen' : 'Geschlossen';
		}

		const label = $lang(entity.state) || entity.state;
		const unit = entity.attributes?.unit_of_measurement;
		return unit ? `${label} ${unit}` : label;
	}

	function icon(entity: HassEntity) {
		if (entity.attributes?.icon) return entity.attributes.icon;
		if (isContact(entity)) {
			return entity.state === 'on' ? 'mdi:door-open' : 'mdi:door-closed';
		}
		return entity.state === 'on' ? 'mdi:check-circle-outline' : 'mdi:circle-outline';
	}
</script>

{#if isOpen}
	<Modal>
		<h1 slot="title">{group?.label || $lang('power_summary')}</h1>

		{#if entities.length > 0}
			<div
				class="entities"
				style:grid-template-columns={`repeat(${columns}, minmax(0, 1fr))`}
			>
				{#each entities as entity (entity.entity_id)}
					<div class:active={entity.state === 'on'} class="entity">
						<Icon icon={icon(entity)} height="1.25rem" width="1.25rem" />
						<div class="copy">
							<strong>{getName(undefined, entity) || entity.entity_id}</strong>
							<span>{stateLabel(entity)}</span>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<p class="empty">{$lang('unknown')}</p>
		{/if}
	</Modal>
{/if}

<style>
	.entities {
		display: grid;
		grid-template-columns: repeat(1, minmax(0, 1fr));
		gap: 0.35rem;
	}

	.entity {
		display: flex;
		min-width: 0;
		align-items: center;
		gap: 0.75rem;
		padding: 0.7rem 0.8rem;
		border-radius: var(--theme-border-radius-card, 0.5rem);
		background: var(--theme-colors-surface, rgba(0, 0, 0, 0.16));
	}

	.entity > :global(svg) {
		flex: 0 0 auto;
		color: rgba(255, 255, 255, 0.68);
	}

	.copy {
		display: grid;
		min-width: 0;
		gap: 0.1rem;
	}

	.copy strong,
	.copy span {
		overflow-wrap: anywhere;
	}

	.copy strong {
		font-size: 0.92rem;
		font-weight: 600;
	}

	.copy span {
		font-size: 0.82rem;
		opacity: 0.7;
	}

	.entity.active > :global(svg),
	.entity.active .copy span {
		color: #f0b45a;
		opacity: 1;
	}

	.empty {
		opacity: 0.7;
	}
</style>