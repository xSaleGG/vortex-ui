import { getName } from '$lib/Utils';
import type { PowerSummaryGroup } from '$lib/Types';
import type { HassEntities, HassEntity } from 'home-assistant-js-websocket';

export interface PowerSummaryResult {
	group: PowerSummaryGroup;
	count: number;
	total: number;
	displayText: string;
	entities: HassEntity[];
}

export function getPowerSummaryResults(
	groups: PowerSummaryGroup[],
	currentStates: HassEntities | undefined
): PowerSummaryResult[] {
	return groups.map((group) => {
		const domains = group.domains ?? [];
		const included = group.include === undefined ? undefined : new Set(group.include);
		const excluded = new Set(group.exclude ?? []);
		const onStates = new Set(group.on_states ?? ['on']);

		const entities = Object.entries(currentStates ?? {})
			.filter(([id]) => {
				if (included) return included.has(id);
				const domain = id.split('.')[0];
				return domains.includes(domain) && !excluded.has(id);
			})
			.map(([, entity]) => entity);
		const active = entities.filter((entity) => onStates.has(entity.state));

		return {
			group,
			count: active.length,
			total: entities.length,
			displayText:
				active.length === 1
					? (getName(undefined, active[0]) ?? active[0].entity_id.split('.')[1])
					: '',
			entities
		};
	});
}