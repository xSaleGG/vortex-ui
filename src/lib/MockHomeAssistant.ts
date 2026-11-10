import type {
	Connection,
	HassConfig,
	HassEntities,
	HassServices
} from 'home-assistant-js-websocket';
import { get } from 'svelte/store';
import { config, connected, connection, demoMode, services, states } from '$lib/Stores';

const now = () => new Date().toISOString();

function createEntity(entity_id: string, state: string, attributes: Record<string, unknown> = {}) {
	const timestamp = now();
	const friendlyName = entity_id.split('.')[1].replaceAll('_', ' ');
	return {
		entity_id,
		state,
		attributes: { friendly_name: friendlyName, ...attributes },
		last_changed: timestamp,
		last_updated: timestamp,
		context: { id: 'vortex-demo', parent_id: null, user_id: null }
	};
}

const mockEntities = {
	'light.demo_wohnzimmer_decke': createEntity('light.demo_wohnzimmer_decke', 'on', {
		friendly_name: 'Deckenlicht',
		icon: 'mdi:ceiling-light',
		brightness: 198,
		color_temp_kelvin: 2700,
		color_mode: 'color_temp',
		supported_color_modes: ['color_temp']
	}),
	'light.demo_wohnzimmer_stehlampe': createEntity('light.demo_wohnzimmer_stehlampe', 'off', {
		friendly_name: 'Stehlampe',
		icon: 'mdi:floor-lamp',
		brightness: 120,
		supported_color_modes: ['brightness']
	}),
	'sensor.demo_aussentemperatur': createEntity('sensor.demo_aussentemperatur', '18.6', {
		friendly_name: 'Aussentemperatur',
		device_class: 'temperature',
		unit_of_measurement: 'C',
		state_class: 'measurement'
	}),
	'sensor.demo_luftfeuchtigkeit': createEntity('sensor.demo_luftfeuchtigkeit', '46', {
		friendly_name: 'Luftfeuchtigkeit',
		device_class: 'humidity',
		unit_of_measurement: '%',
		state_class: 'measurement'
	}),
	'sensor.demo_stromverbrauch': createEntity('sensor.demo_stromverbrauch', '684', {
		friendly_name: 'Stromverbrauch',
		device_class: 'power',
		unit_of_measurement: 'W',
		state_class: 'measurement'
	}),
	'sensor.demo_energie': createEntity('sensor.demo_energie', '12.8', {
		friendly_name: 'Energie heute',
		device_class: 'energy',
		unit_of_measurement: 'kWh',
		state_class: 'total_increasing'
	}),
	'sensor.demo_batterie': createEntity('sensor.demo_batterie', '78', {
		friendly_name: 'Batterie',
		device_class: 'battery',
		unit_of_measurement: '%',
		state_class: 'measurement'
	}),
	'binary_sensor.demo_balkontuer': createEntity('binary_sensor.demo_balkontuer', 'off', {
		friendly_name: 'Balkontuer',
		device_class: 'door'
	}),
	'climate.demo_haus': createEntity('climate.demo_haus', 'heat', {
		friendly_name: 'Raumklima',
		current_temperature: 20.5,
		temperature: 21,
		humidity: 44,
		hvac_action: 'heating',
		hvac_modes: ['off', 'heat', 'cool', 'auto']
	}),
	'cover.demo_wohnzimmer': createEntity('cover.demo_wohnzimmer', 'open', {
		friendly_name: 'Beschattung',
		current_position: 42,
		device_class: 'shutter'
	}),
	'switch.demo_kaffeemaschine': createEntity('switch.demo_kaffeemaschine', 'off', {
		friendly_name: 'Kaffeemaschine',
		icon: 'mdi:coffee-maker'
	}),
	'media_player.demo_lautsprecher': createEntity('media_player.demo_lautsprecher', 'playing', {
		friendly_name: 'Wohnzimmer Lautsprecher',
		media_title: 'Demo Playlist',
		media_artist: 'Vortex Radio',
		volume_level: 0.35,
		entity_picture: ''
	}),
	'weather.demo_haus': createEntity('weather.demo_haus', 'partlycloudy', {
		friendly_name: 'Wetter',
		temperature: 18.6,
		temperature_unit: 'C',
		humidity: 46,
		wind_speed: 12,
		wind_speed_unit: 'km/h',
		forecast: []
	}),
	'camera.demo_wohnzimmer': createEntity('camera.demo_wohnzimmer', 'idle', {
		friendly_name: 'Wohnzimmer Kamera',
		entity_picture: ''
	}),
	'timer.demo_tee': createEntity('timer.demo_tee', 'active', {
		friendly_name: 'Tee Timer',
		duration: '0:05:00',
		remaining: '0:02:14'
	}),
	'input_boolean.demo_gastemodus': createEntity('input_boolean.demo_gastemodus', 'on', {
		friendly_name: 'Gaeste-Modus'
	}),
	'person.demo_benutzer': createEntity('person.demo_benutzer', 'home', {
		friendly_name: 'Demo Benutzer',
		latitude: 52.52,
		longitude: 13.405
	}),
	'vacuum.demo_staubsauger': createEntity('vacuum.demo_staubsauger', 'docked', {
		friendly_name: 'Staubsauger',
		battery_level: 86,
		fan_speed: 'standard'
	}),
	'lock.demo_haustuer': createEntity('lock.demo_haustuer', 'locked', {
		friendly_name: 'Haustuer'
	}),
	'fan.demo_ventilator': createEntity('fan.demo_ventilator', 'off', {
		friendly_name: 'Ventilator',
		percentage: 0,
		percentage_step: 25
	}),
	'sun.sun': createEntity('sun.sun', 'above_horizon', {
		friendly_name: 'Sonne',
		next_rising: '2026-11-11T06:42:00+00:00',
		next_setting: '2026-11-10T16:18:00+00:00'
	})
} as HassEntities;

const mockConfig = {
	latitude: 52.52,
	longitude: 13.405,
	elevation: 34,
	unit_system: { length: 'km', mass: 'kg', pressure: 'hPa', temperature: 'C', volume: 'L' },
	location_name: 'Vortex UI Demo',
	time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
	components: [],
	version: 'demo'
} as unknown as HassConfig;

const mockServices = {
	homeassistant: { turn_on: {}, turn_off: {}, toggle: {} },
	light: { turn_on: {}, turn_off: {}, toggle: {} },
	switch: { turn_on: {}, turn_off: {}, toggle: {} },
	cover: { open_cover: {}, close_cover: {}, set_cover_position: {} },
	climate: { set_temperature: {}, set_hvac_mode: {} },
	media_player: { media_play: {}, media_pause: {}, media_play_pause: {}, volume_set: {} },
	timer: { start: {}, pause: {}, cancel: {} },
	lock: { lock: {}, unlock: {} },
	fan: { turn_on: {}, turn_off: {}, toggle: {} }
} as unknown as HassServices;

function applyService(message: any) {
	const data = message.service_data ?? {};
	const target = message.target?.entity_id ?? data.entity_id;
	const entityIds = Array.isArray(target) ? target : target ? [target] : [];
	if (entityIds.length === 0) return;

	states.update((current) => {
		if (!current) return current;
		const updated = { ...current };
		const timestamp = now();

		for (const entityId of entityIds) {
			const entity = updated[entityId];
			if (!entity) continue;

			let state = entity.state;
			const attributes = { ...entity.attributes };
			const service = message.service;

			if (service === 'toggle' || service === 'media_play_pause') {
				state = ['on', 'playing', 'open', 'unlocked'].includes(state)
					? entity.entity_id.startsWith('media_player.')
						? 'paused'
						: 'off'
					: entity.entity_id.startsWith('media_player.')
						? 'playing'
						: 'on';
			} else if (service === 'turn_on' || service === 'open_cover' || service === 'unlock') {
				state = service === 'unlock' ? 'unlocked' : service === 'open_cover' ? 'open' : 'on';
			} else if (service === 'turn_off' || service === 'close_cover' || service === 'lock') {
				state = service === 'lock' ? 'locked' : service === 'close_cover' ? 'closed' : 'off';
			} else if (service === 'media_play') {
				state = 'playing';
			} else if (service === 'media_pause') {
				state = 'paused';
			} else if (service === 'start') {
				state = 'active';
			} else if (service === 'pause') {
				state = 'paused';
			} else if (service === 'cancel') {
				state = 'idle';
			} else if (service === 'set_value') {
				state = String(data.value ?? state);
			} else if (service === 'select_option') {
				state = String(data.option ?? state);
			}

			if (data.brightness !== undefined) attributes.brightness = data.brightness;
			if (data.temperature !== undefined) attributes.temperature = data.temperature;
			if (data.current_position !== undefined) {
				attributes.current_position = data.current_position;
				state = data.current_position === 0 ? 'closed' : 'open';
			}
			if (data.volume_level !== undefined) attributes.volume_level = data.volume_level;
			if (data.hvac_mode !== undefined) state = data.hvac_mode;

			updated[entityId] = {
				...entity,
				state,
				attributes,
				last_changed: timestamp,
				last_updated: timestamp
			};
		}

		return updated;
	});
}

const mockConnection = {
	sendMessagePromise(message: any) {
		if (message?.type === 'call_service') applyService(message);
		if (message?.type === 'get_states') return Promise.resolve(Object.values(get(states) ?? {}));
		if (message?.type === 'frontend/get_user_data') return Promise.resolve({ value: {} });
		if (message?.type === 'render_template') return Promise.resolve({ result: '' });
		return Promise.resolve({});
	},
	sendMessage() {},
	subscribeMessage() {
		return Promise.resolve(() => {});
	},
	addEventListener() {},
	removeEventListener() {},
	close() {}
} as unknown as Connection;

export function activateMockHomeAssistant() {
	demoMode.set(true);
	states.set(mockEntities);
	config.set(mockConfig);
	services.set(mockServices);
	connection.set(mockConnection);
	connected.set(false);
}
