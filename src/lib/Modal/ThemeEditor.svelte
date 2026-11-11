<script lang="ts">
	import { base } from '$app/paths';
	import { lang } from '$lib/Stores';
	import { closeModal } from 'svelte-modals';
	import { onMount } from 'svelte';
	import Modal from '$lib/Modal/Index.svelte';
	import Icon from '@iconify/svelte';
	import Ripple from 'svelte-ripple';
	import { ripple } from '$lib/Stores';

	export let isOpen: boolean;
	export let theme: any = undefined;
	export let onSaved: (theme: any) => void = () => {};

	const starterTokens: Record<string, string> = {
		'colors-text': '#f4f4f0',
		'colors-icon': '#f4f4f0',
		'colors-title': '#ffffff',
		'colors-accent': '#e5a56b',
		'colors-accent-contrast': '#1b2928',
		'colors-accent-subtle': 'rgba(229, 165, 107, 0.2)',
		'colors-success': '#78b89a',
		'colors-warning': '#e5bd72',
		'colors-danger': '#df7772',
		'colors-info': '#77a9c8',
		'colors-surface': 'rgba(17, 31, 31, 0.65)',
		'colors-surface-raised': 'rgba(28, 48, 47, 0.92)',
		'colors-border': 'rgba(229, 241, 235, 0.22)',
		'colors-text-muted': 'rgb(190, 204, 198)',
		'colors-sidebar-border': '1px solid rgba(229, 241, 235, 0.2)',
		'colors-sidebar-background': 'rgba(16, 29, 29, 0.45)',
		'sizes-sidebar-time': '3.4rem',
		'background-image': 'linear-gradient(145deg, #172c2a 0%, #354440 100%)',
		'font-family': "'Inter Variable', system-ui",
		'button-background-color-on': '#f4f4f0',
		'button-background-color-off': 'rgba(17, 31, 31, 0.7)',
		'drawer-button-background-color': 'rgba(17, 31, 31, 0.58)',
		'button-name-color-on': '#172c2a',
		'button-name-color-off': '#f4f4f0',
		'button-state-color-on': '#44514c',
		'button-state-color-off': '#bec9c3',
		'modal-background-color': 'rgba(16, 29, 29, 0.35)',
		'border-radius': '0.5rem',
		'border-radius-button': '0.45rem',
		'border-radius-control': '0.6rem',
		'border-radius-card': '0.8rem',
		'border-radius-modal': '1rem',
		'sidebar-font-size': '1rem',
		'sidebar-item-padding': '0.6rem 0.6rem',
		'sidebar-padding': '0 1.4rem',
		'drawer-font-size': '0.925rem',
		'sidebar-divider': '1px solid rgba(229, 241, 235, 0.2)',
		'navigate-background-color': 'rgba(229, 241, 235, 0.15)',
		'app-color': '#354440',
		'modal-background-color-modal': 'rgba(21, 34, 33, 0.92)',
		'modal-background-color-sticky': '#152221'
	};

	const colorKeys = [
		'colors-text',
		'colors-icon',
		'colors-title',
		'colors-accent',
		'colors-accent-contrast',
		'colors-accent-subtle',
		'colors-success',
		'colors-warning',
		'colors-danger',
		'colors-info',
		'colors-border',
		'colors-text-muted',
		'button-background-color-on',
		'button-background-color-off',
		'drawer-button-background-color',
		'button-name-color-on',
		'button-name-color-off',
		'button-state-color-on',
		'button-state-color-off',
		'app-color'
	];
	const surfaceKeys = [
		'colors-surface',
		'colors-surface-raised',
		'colors-sidebar-background',
		'colors-sidebar-border',
		'modal-background-color',
		'modal-background-color-modal',
		'modal-background-color-sticky',
		'navigate-background-color',
		'background-image'
	];
	const shapeKeys = [
		'border-radius',
		'border-radius-button',
		'border-radius-control',
		'border-radius-card',
		'border-radius-modal'
	];
	const layoutKeys = [
		'font-family',
		'sizes-sidebar-time',
		'sidebar-font-size',
		'sidebar-item-padding',
		'sidebar-padding',
		'drawer-font-size',
		'sidebar-divider'
	];
	const knownKeys = new Set([...colorKeys, ...surfaceKeys, ...shapeKeys, ...layoutKeys]);

	let name = theme
		? theme.custom
			? theme.name || theme.title
			: `${theme.name || theme.title} copy`
		: '';
	let tokenValues: Record<string, string> = { ...(theme?.theme ?? starterTokens) };
	let saving = false;
	let saveError = '';

	$: customKeys = Object.keys(tokenValues).filter((key) => !knownKeys.has(key));
	$: sections = [
		{ title: $lang('theme_editor_colors'), keys: colorKeys.filter((key) => key in tokenValues) },
		{
			title: $lang('theme_editor_surfaces'),
			keys: surfaceKeys.filter((key) => key in tokenValues)
		},
		{ title: $lang('theme_editor_shape'), keys: shapeKeys.filter((key) => key in tokenValues) },
		{ title: $lang('theme_editor_layout'), keys: layoutKeys.filter((key) => key in tokenValues) },
		{ title: $lang('theme_editor_other'), keys: customKeys }
	].filter((section) => section.keys.length > 0);
	$: previewStyle = Object.entries(tokenValues)
		.map(([key, value]) => {
			const resolvedValue =
				key === 'background-image' && value.includes('/themes/')
					? value.replace('/themes/', `${base}/themes/`)
					: value;
			return `--theme-${key}: ${resolvedValue};`;
		})
		.join(' ');

	onMount(() => {
		if (!name) name = $lang('theme_editor_new');
	});

	function updateToken(key: string, value: string) {
		tokenValues = { ...tokenValues, [key]: value };
	}

	function tokenLabel(key: string) {
		return key
			.replace(/^colors-/, '')
			.split('-')
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join(' ');
	}

	function isColorToken(key: string) {
		return key.includes('color') && !key.includes('sidebar-border');
	}

	function colorValue(value: string) {
		const hex = value.match(/^#([\da-f]{3}|[\da-f]{6})$/i)?.[1];
		if (hex?.length === 3) return `#${[...hex].map((part) => part + part).join('')}`;
		if (hex) return `#${hex}`;

		const rgb = value.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
		if (rgb) {
			return `#${rgb
				.slice(1)
				.map((part) => Math.round(Number(part)).toString(16).padStart(2, '0'))
				.join('')}`;
		}
		return '#ffffff';
	}

	async function saveTheme() {
		if (!name.trim() || saving) return;

		saving = true;
		saveError = '';
		try {
			const response = await fetch(`${base}/_api/save_theme`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: theme?.custom ? theme.title : undefined,
					name: name.trim(),
					theme: tokenValues
				})
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.message);
			onSaved(data);
			closeModal();
		} catch (error) {
			console.error(error);
			saveError = $lang('theme_editor_save_error');
		} finally {
			saving = false;
		}
	}
</script>

{#if isOpen}
	<Modal size="large">
		<h1 slot="title">{$lang('theme_editor')}</h1>

		<div class="editor-workspace" data-exclude-drag-modal>
			<div class="controls">
				<label class="name-field">
					<span>{$lang('theme_editor_name')}</span>
					<input bind:value={name} maxlength="60" required />
				</label>

				<p class="preservation-note">
					{$lang(theme?.custom ? 'theme_editor_custom_note' : 'theme_editor_copy_note')}
				</p>

				{#each sections as section (section.title)}
					<section class="token-section">
						<h2>{section.title}</h2>
						<div class="token-list">
							{#each section.keys as key (key)}
								<label class="token-row" title={key}>
									<span class="token-label">{tokenLabel(key)}</span>
									<span class="token-control">
										{#if isColorToken(key)}
											<input
												class="color-input"
												type="color"
												value={colorValue(tokenValues[key])}
												aria-label={`${tokenLabel(key)} color picker`}
												on:input={(event) => updateToken(key, event.currentTarget.value)}
											/>
										{/if}
										<input
											class="value-input"
											value={tokenValues[key]}
											aria-label={`${tokenLabel(key)} CSS value`}
											on:input={(event) => updateToken(key, event.currentTarget.value)}
										/>
									</span>
								</label>
							{/each}
						</div>
					</section>
				{/each}
			</div>

			<aside class="preview-panel">
				<h2>{$lang('theme_editor_preview')}</h2>
				<div class="theme-preview" style={previewStyle}>
					<div class="preview-header">
						<span>VORTEX</span>
						<button class="accent-button">{$lang('theme_editor_accent')}</button>
					</div>
					<div class="preview-content">
						<div class="preview-sidebar">
							<strong>{$lang('theme_editor_sidebar')}</strong>
							<span>21.5° · 14:32</span>
							<span class="muted">{$lang('theme_editor_weather')}</span>
						</div>
						<div class="preview-main">
							<div class="preview-card">
								<div class="preview-icon">☼</div>
								<div>
									<strong>{$lang('theme_editor_living_room')}</strong>
									<span class="muted">{$lang('theme_editor_light_on')}</span>
								</div>
							</div>
							<div class="preview-card secondary-card">
								<strong>{$lang('theme_editor_controls')}</strong>
								<div class="control-row">
									<span class="control-chip">{$lang('theme_editor_control')}</span>
									<span class="control-switch"></span>
								</div>
							</div>
						</div>
					</div>
				</div>
				<p class="preview-caption">{$lang('theme_editor_preview_note')}</p>
			</aside>
		</div>

		<div class="editor-footer">
			{#if saveError}<span class="save-error" role="alert">{saveError}</span>{/if}
			<button class="cancel-button" on:click={closeModal}>
				{$lang('theme_editor_cancel')}
			</button>
			<button
				class="save-button"
				disabled={!name.trim() || saving}
				on:click={saveTheme}
				use:Ripple={$ripple}
			>
				<Icon
					icon={theme?.custom ? 'mdi:content-save-outline' : 'mdi:content-copy'}
					height="1rem"
				/>
				{$lang(
					theme?.custom
						? 'theme_editor_save'
						: theme
							? 'theme_editor_save_copy'
							: 'theme_editor_create'
				)}
			</button>
		</div>
	</Modal>
{/if}

<style>
	.editor-workspace {
		display: grid;
		grid-template-columns: minmax(18rem, 1fr) minmax(18rem, 0.9fr);
		gap: 1.25rem;
		min-width: min(74vw, 58rem);
		height: min(65vh, 48rem);
		overflow-y: auto;
	}

	.controls {
		min-width: 0;
		overflow: visible;
		padding-right: 0.4rem;
	}

	.name-field {
		display: grid;
		gap: 0.45rem;
		font-weight: 600;
	}

	.name-field input,
	.value-input {
		min-width: 0;
		border: 1px solid var(--theme-colors-border, rgba(255, 255, 255, 0.18));
		border-radius: var(--theme-border-radius-control, 0.6rem);
		background: var(--theme-colors-surface, rgba(0, 0, 0, 0.2));
		color: var(--theme-colors-text, white);
		font: inherit;
	}

	.name-field input {
		padding: 0.65rem 0.75rem;
	}

	.preservation-note,
	.preview-caption {
		color: var(--theme-colors-text-muted, rgba(255, 255, 255, 0.65));
		font-size: 0.82rem;
		line-height: 1.45;
	}

	.token-section {
		margin-top: 1.2rem;
		padding-top: 0.9rem;
		border-top: 1px solid var(--theme-colors-border, rgba(255, 255, 255, 0.15));
	}

	.token-section h2,
	.preview-panel h2 {
		margin: 0 0 0.65rem;
		font-size: 1rem;
	}

	.token-list {
		display: grid;
		gap: 0.45rem;
	}

	.token-row {
		display: grid;
		grid-template-columns: minmax(6.5rem, 0.8fr) minmax(0, 1.2fr);
		align-items: center;
		gap: 0.6rem;
		min-width: 0;
		font-size: 0.82rem;
	}

	.token-label {
		text-transform: capitalize;
	}

	.token-control {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		min-width: 0;
	}

	.color-input {
		width: 2rem;
		min-width: 2rem;
		height: 2rem;
		padding: 0.15rem;
		border: 1px solid var(--theme-colors-border, rgba(255, 255, 255, 0.2));
		border-radius: var(--theme-border-radius-control, 0.6rem);
		background: var(--theme-colors-surface, rgba(0, 0, 0, 0.2));
		cursor: pointer;
	}

	.value-input {
		width: 100%;
		padding: 0.4rem 0.5rem;
		font-family: ui-monospace, monospace;
		font-size: 0.78rem;
	}

	.preview-panel {
		position: sticky;
		top: 0;
		z-index: 2;
		align-self: start;
		min-width: 0;
		padding: 0.5rem 0;
		background: var(--theme-modal-background-color-modal, rgba(20, 20, 20, 0.96));
	}

	.theme-preview {
		min-height: 21rem;
		padding: 0.75rem;
		border: 1px solid var(--theme-colors-border, rgba(255, 255, 255, 0.2));
		border-radius: var(--theme-border-radius-modal, 1rem);
		background-color: var(--theme-colors-surface, #24302f);
		background-image: var(--theme-background-image);
		background-size: cover;
		background-position: center;
		color: var(--theme-colors-text, white);
		font-family: var(--theme-font-family, inherit);
	}

	.preview-header,
	.preview-content,
	.preview-card,
	.control-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.65rem;
	}

	.preview-header {
		margin-bottom: 0.8rem;
		font-size: 0.72rem;
		font-weight: 700;
	}

	.accent-button {
		padding: 0.35rem 0.6rem;
		border: 0;
		border-radius: var(--theme-border-radius-button, 0.4rem);
		background: var(--theme-colors-accent, #e5a56b);
		color: var(--theme-colors-accent-contrast, #172c2a);
		font: inherit;
	}

	.preview-content {
		align-items: stretch;
	}

	.preview-sidebar {
		display: flex;
		flex: 0 0 34%;
		flex-direction: column;
		gap: 0.55rem;
		padding: 0.7rem;
		border: 1px solid var(--theme-colors-sidebar-border, var(--theme-colors-border, transparent));
		border-radius: var(--theme-border-radius-card, 0.65rem);
		background: var(--theme-colors-sidebar-background, var(--theme-colors-surface, transparent));
		font-size: 0.72rem;
	}

	.preview-main {
		display: grid;
		flex: 1;
		align-content: start;
		gap: 0.55rem;
	}

	.preview-card {
		justify-content: flex-start;
		min-width: 0;
		padding: 0.65rem;
		border: 1px solid var(--theme-colors-border, transparent);
		border-radius: var(--theme-border-radius-card, 0.65rem);
		background: var(--theme-button-background-color-off, var(--theme-colors-surface, #1d2928));
		font-size: 0.75rem;
	}

	.preview-card > div:last-child,
	.secondary-card {
		display: grid;
		gap: 0.35rem;
	}

	.preview-icon {
		display: grid;
		flex: 0 0 2rem;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: var(--theme-button-background-color-on, white);
		color: var(--theme-button-name-color-on, #222);
	}

	.muted {
		color: var(--theme-colors-text-muted, rgba(255, 255, 255, 0.65));
		font-size: 0.68rem;
	}

	.control-row {
		font-size: 0.7rem;
	}

	.control-chip {
		padding: 0.3rem 0.45rem;
		border-radius: var(--theme-border-radius-control, 0.6rem);
		background: var(--theme-colors-surface-raised, rgba(255, 255, 255, 0.12));
	}

	.control-switch {
		width: 1.8rem;
		height: 0.95rem;
		border-radius: 1rem;
		background: var(--theme-colors-accent, #e5a56b);
	}

	.preview-caption {
		margin: 0.55rem 0 0;
	}

	.editor-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.6rem;
		margin-top: 1rem;
		padding-top: 0.8rem;
		border-top: 1px solid var(--theme-colors-border, rgba(255, 255, 255, 0.12));
	}

	.editor-footer button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		min-height: 2.4rem;
		padding: 0.45rem 0.75rem;
		border: 1px solid var(--theme-colors-border, rgba(255, 255, 255, 0.2));
		border-radius: var(--theme-border-radius-button, 0.4rem);
		background: var(--theme-colors-surface, rgba(255, 255, 255, 0.06));
		color: var(--theme-colors-text, white);
		font: inherit;
		cursor: pointer;
	}

	.editor-footer .save-button {
		border-color: transparent;
		background: var(--theme-colors-accent, #e5a56b);
		color: var(--theme-colors-accent-contrast, #172c2a);
	}

	.save-button:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.save-error {
		flex: 1;
		color: var(--theme-colors-danger, #df7772);
		font-size: 0.82rem;
	}

	@media (max-width: 760px) {
		.editor-workspace {
			display: flex;
			flex-direction: column;
			min-width: 0;
			height: 62vh;
		}

		.controls {
			padding-right: 0;
		}

		.preview-panel {
			order: -1;
		}

		.theme-preview {
			min-height: 12rem;
		}

		.preview-caption {
			display: none;
		}
	}
</style>
