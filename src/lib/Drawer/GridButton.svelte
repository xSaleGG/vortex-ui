<script lang="ts">
	import { dashboard, motion, record, ripple } from '$lib/Stores';
	import Ripple from 'svelte-ripple';
	import Icon from '@iconify/svelte';
	import { generateId } from '$lib/Utils';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
	export let view: any;

	$: disabled = !view?.sections;

	function handleClick() {
		if (!view?.sections) return;

		view.sections = [
			{
				type: 'grid',
				name: 'Grid',
				columns: 12,
				items: [],
				id: generateId($dashboard)
			},
			...view.sections
		];

		$dashboard = $dashboard;
		$record();
		dispatch('clicked');
	}
</script>

<button
	class="button dropdown"
	on:click={handleClick}
	use:Ripple={{ ...$ripple, opacity: disabled ? '0' : $ripple.opacity }}
	style:cursor={disabled ? 'unset' : 'pointer'}
	style:opacity={disabled ? '0.5' : '1'}
	style:transition="opacity {$motion}ms ease"
>
	<figure>
		<Icon icon="mdi:view-grid-plus-outline" height="none" />
	</figure>

	Grid
</button>
