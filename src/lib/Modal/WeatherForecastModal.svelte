<script lang="ts">
	import { states, lang } from '$lib/Stores';
	import Modal from '$lib/Modal/Index.svelte';
	import WeatherForecast from '$lib/Sidebar/WeatherForecast.svelte';
	import type { WeatherForecastItem } from '$lib/Types';

	export let sel: WeatherForecastItem;

	$: entity = sel?.entity_id ? $states?.[sel.entity_id] : undefined;
	$: attributes = entity?.attributes;
	$: condition = entity?.state ? $lang(`weather_${entity.state.replace('-', '_')}`) : undefined;
	$: daysToShow = Math.min(sel?.detail_days_to_show ?? 7, 7);
	$: weatherDetails = [
		{ label: $lang('humidity'), value: attributes?.humidity, unit: '%' },
		{ label: $lang('pressure'), value: attributes?.pressure, unit: attributes?.pressure_unit },
		{
			label: $lang('wind_speed'),
			value: attributes?.wind_speed,
			unit: attributes?.wind_speed_unit
		},
		{ label: $lang('uv_index'), value: attributes?.uv_index }
	].filter((detail) => detail.value !== undefined && detail.value !== null);
</script>

<Modal size="large">
	<h1 slot="title">{$lang('weather_forecast')}</h1>

	{#if entity}
		<div class="current-weather">
			<div>
				{#if condition}<div class="condition">{condition}</div>{/if}
				{#if attributes?.temperature !== undefined}
					<div class="temperature">
						{Math.round(attributes.temperature)}{attributes.temperature_unit || '°'}
					</div>
				{/if}
			</div>
			{#if weatherDetails.length > 0}
				<dl class="weather-details">
					{#each weatherDetails as detail (detail.label)}
						<div>
							<dt>{detail.label}</dt>
							<dd>{detail.value}{detail.unit ? ` ${detail.unit}` : ''}</dd>
						</div>
					{/each}
				</dl>
			{/if}
		</div>
	{/if}

	<h2>{$lang('days_to_show_detail')}: {daysToShow}</h2>
	<div class="forecast-wrap">
		<WeatherForecast {sel} expanded={true} subscribe={false} />
	</div>
</Modal>

<style>
	.current-weather {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		padding: 0.5rem 0 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.16);
	}

	.condition {
		font-size: 1rem;
		opacity: 0.75;
	}

	.temperature {
		font-size: 2rem;
		font-weight: 600;
	}

	.weather-details {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.5rem 1.25rem;
		margin: 0;
	}

	.weather-details div {
		min-width: 5rem;
	}

	.weather-details dt {
		font-size: 0.8rem;
		opacity: 0.65;
	}

	.weather-details dd {
		margin: 0.15rem 0 0;
		font-weight: 600;
	}

	.forecast-wrap {
		padding-top: 0.25rem;
	}

	@media (max-width: 600px) {
		.current-weather {
			align-items: flex-start;
			flex-direction: column;
			gap: 0.75rem;
		}

		.weather-details {
			justify-content: flex-start;
		}
	}
</style>
