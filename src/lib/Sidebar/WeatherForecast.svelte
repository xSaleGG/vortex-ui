<script lang="ts">
	import { states, selectedLanguage, lang, connection, forecasts, dragging } from '$lib/Stores';
	import { iconMapMaterialSymbolsLight, iconMapMeteocons, iconMapWeatherIcons } from '$lib/Weather';
	import type { WeatherIconSet, WeatherIconConditions, WeatherIconMapping } from '$lib/Weather';
	import Icon from '@iconify/svelte';
	import { getSupport } from '$lib/Utils';
	import { onDestroy } from 'svelte';
	import { writable } from 'svelte/store';

	export let sel: any;
	export let expanded = false;
	export let subscribe = true;

	let unsubscribe: any;
	let busy = false;
	const debug = false;

	$: entity = $states?.[sel?.entity_id];
	$: attributes = entity?.attributes;
	$: supported_features = attributes?.supported_features;

	$: supports = getSupport(supported_features, {
		FORECAST_DAILY: 1,
		FORECAST_HOURLY: 2,
		FORECAST_TWICE_DAILY: 4
	});

	/**
	 * tame reactivity
	 */
	const entity_id = writable<string | undefined>(sel?.entity_id);
	const forecast_type = writable<string | undefined>(sel?.forecast_type);

	$: if (sel?.entity_id) $entity_id = sel?.entity_id;
	$: if (!sel?.forecast_type || sel?.forecast_type) $forecast_type = sel?.forecast_type;

	// forecast_type fallback
	$: defaultForecastType = Object.keys(supports)
		?.find((key) => supports?.[key])
		?.replace('FORECAST_', '')
		?.toLowerCase();

	// get forecast when not dragging
	// and when entity_id or forecast_type changes
	$: if (
		subscribe &&
		($forecast_type || !$forecast_type) &&
		$entity_id &&
		!$dragging &&
		defaultForecastType
	) {
		getForecast();

		if (debug) {
			console.debug({
				$forecast_type,
				$entity_id,
				$dragging
			});
		}
	}

	async function getForecast() {
		if (busy) return;
		busy = true;

		// cleanup old sub
		if (unsubscribe) {
			if (debug) console.debug('forecast unsubscribed');
			unsubscribe?.();
		}

		try {
			unsubscribe = await $connection?.subscribeMessage(
				(data: any) => {
					$forecasts[sel?.id] = { ...data, entity_id: $entity_id, subscribed: Date.now() };
					if (debug) console.debug('forecast subscribed');
				},
				{
					type: 'weather/subscribe_forecast',
					entity_id: $entity_id,
					forecast_type: $forecast_type || defaultForecastType
				}
			);
		} catch (err) {
			console.error(err);
		} finally {
			busy = false;
		}
	}

	let iconSet: WeatherIconSet;
	$: {
		if (sel?.icon_pack === 'materialsymbolslight') {
			iconSet = iconMapMaterialSymbolsLight;
		} else if (sel?.icon_pack === 'meteocons') {
			iconSet = iconMapMeteocons;
		} else if (sel?.icon_pack === 'weathericons') {
			iconSet = iconMapWeatherIcons;
		} else {
			iconSet = iconMapMeteocons;
		}
	}

	// Because config may not include days_to_show, and some forecasts proviode 48 datapoints, we need to ensure it's correct
	$: calculated = Math.min(
		expanded ? (sel?.detail_days_to_show ?? 7) : (sel?.days_to_show ?? 7),
		7
	);

	interface Forecast {
		condition: string;
		icon: WeatherIconMapping;
		date: string;
		temperature: number;
	}

	let forecast: Forecast[];
	$: forecast = $forecasts?.[sel?.id]?.forecast?.slice(0, calculated).map(function (item: any) {
		let icon: WeatherIconMapping =
			iconSet.conditions[item?.condition as keyof WeatherIconConditions];
		let x: Forecast = {
			condition: item?.condition,
			icon: icon,
			date: item?.datetime,
			temperature: item?.temperature
		};

		return x;
	});

	// Different forecast providers choose different intervals, we need to figure out display based on this
	$: forecast_diff =
		(new Date(forecast?.[1]?.date).valueOf() - new Date(forecast?.[0]?.date).valueOf()) / 3600000;

	// cleanup
	onDestroy(() => {
		if (unsubscribe) {
			if (debug) console.debug('forecast destroyed');
			unsubscribe?.();
		}
	});
</script>

{#if forecast}
	<div class="container" class:expanded>
		{#each forecast as forecast}
			<div class="item">
				<div class="day">
					{#if expanded}
						{new Intl.DateTimeFormat($selectedLanguage, {
							weekday: 'short',
							month: 'short',
							day: 'numeric'
						}).format(new Date(forecast.date))}
					{:else if forecast_diff < 24}
						{new Intl.DateTimeFormat($selectedLanguage, { hour: 'numeric' }).format(
							new Date(forecast.date)
						)}
					{:else}
						{new Intl.DateTimeFormat($selectedLanguage, { weekday: 'short' }).format(
							new Date(forecast.date)
						)}
					{/if}
				</div>

				<div class="icon">
					{#if forecast.icon.local}
						<icon class="ff-fill">
							<img src="{forecast.icon.icon_variant_day}.svg" width="100%" height="100%" alt="" />
						</icon>
					{:else}
						<Icon icon={forecast.icon.icon_variant_day} width="100%" height="100%"></Icon>
					{/if}
				</div>

				<div class="temp">
					{Math.round(forecast.temperature)}{attributes?.temperature_unit || '°'}
				</div>
				{#if expanded}
					<div class="condition">{$lang(`weather_${forecast.condition?.replace('-', '_')}`)}</div>
				{/if}
			</div>
		{/each}
	</div>
{:else}
	<div class="empty">
		{$lang('weather_forecast')}
	</div>
{/if}

<style>
	.item {
		display: grid;
		grid-column-gap: 0px;
		grid-row-gap: 0px;
		grid-template-areas:
			'day'
			'icon'
			'temp';
		text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
		text-overflow: ellipsis;
		overflow: hidden;
		width: 3.6rem;
	}

	.container {
		padding: var(--theme-sidebar-item-padding);
		display: flex;
		text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
		text-overflow: ellipsis;
		overflow: hidden;
		justify-content: space-between;
		min-height: 7.5rem;
	}

	.container.expanded {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 8rem), 1fr));
		gap: 0.75rem;
		min-height: 0;
		overflow: visible;
	}

	.expanded .item {
		width: auto;
		min-width: 0;
		justify-items: center;
		gap: 0.25rem;
	}

	.expanded .day,
	.expanded .temp {
		width: 100%;
	}

	.expanded .day {
		min-height: 1.5rem;
		text-align: center;
	}

	.expanded .icon {
		width: min(100%, 5rem);
		height: 4.5rem;
		transform: none;
	}

	.expanded .temp {
		font-weight: 600;
	}

	.condition {
		display: none;
	}

	.expanded .condition {
		display: block;
		text-align: center;
		font-size: 0.85rem;
		opacity: 0.75;
	}

	.empty {
		word-wrap: break-word;
		padding: 0.5em;
		overflow: hidden;
		text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2);
		min-height: 7.5rem;
	}

	.day {
		grid-area: day;
		justify-content: center;
		display: flex;
		width: 3.6rem;
	}

	.icon {
		grid-area: icon;
		width: 3.6rem;
		height: 3.6rem;
		display: flex;
		text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
		justify-content: center;
		transform-origin: right;
	}

	.temp {
		grid-area: temp;
		justify-content: center;
		display: flex;
		white-space: nowrap;
		width: 3.6rem;
		overflow: hidden;
		text-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
	}

	.ff-fill {
		width: 3.6rem;
		height: 3.6rem;
	}
</style>
