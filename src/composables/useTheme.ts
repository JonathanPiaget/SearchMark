import { nextTick, ref } from 'vue';

export type Theme = 'light' | 'dark' | 'auto';

const themeItem = storage.defineItem<Theme>('local:searchmark_theme', {
	fallback: 'auto',
});

const currentTheme = ref<Theme>('auto');
const appliedTheme = ref<'light' | 'dark'>('light');

/**
 * Get system color scheme preference
 */
const getSystemTheme = (): 'light' | 'dark' => {
	if (
		typeof window !== 'undefined' &&
		window.matchMedia &&
		window.matchMedia('(prefers-color-scheme: dark)').matches
	) {
		return 'dark';
	}
	return 'light';
};

/**
 * Calculate the actual theme to apply based on user preference
 */
const calculateAppliedTheme = (theme: Theme): 'light' | 'dark' => {
	if (theme === 'auto') {
		return getSystemTheme();
	}
	return theme;
};

/**
 * Apply theme to document
 */
const applyTheme = (theme: 'light' | 'dark') => {
	if (typeof document !== 'undefined') {
		document.documentElement.setAttribute('data-theme', theme);
		appliedTheme.value = theme;
	}
};

/**
 * Whether the circular View Transition effect can run for this change
 */
const canAnimateThemeChange = (event?: MouseEvent): event is MouseEvent => {
	return (
		!!event &&
		typeof document !== 'undefined' &&
		'startViewTransition' in document &&
		!window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);
};

/**
 * Apply the theme with an expanding-circle View Transition originating from the
 * click position. Falls back to an instant change when unsupported.
 */
const applyThemeAnimated = async (
	theme: 'light' | 'dark',
	event?: MouseEvent,
) => {
	if (!canAnimateThemeChange(event)) {
		applyTheme(theme);
		return;
	}

	const x = event.clientX;
	const y = event.clientY;
	const endRadius = Math.hypot(
		Math.max(x, window.innerWidth - x),
		Math.max(y, window.innerHeight - y),
	);

	const transition = document.startViewTransition(async () => {
		applyTheme(theme);
		await nextTick();
	});

	await transition.ready;

	const isDark = theme === 'dark';
	const clipPath = [
		`circle(0px at ${x}px ${y}px)`,
		`circle(${endRadius}px at ${x}px ${y}px)`,
	];
	document.documentElement.animate(
		{ clipPath: isDark ? [...clipPath].reverse() : clipPath },
		{
			duration: 400,
			easing: 'ease-out',
			fill: 'forwards',
			pseudoElement: isDark
				? '::view-transition-old(root)'
				: '::view-transition-new(root)',
		},
	);
};

/**
 * Composable for theme management
 */
export const useTheme = () => {
	/**
	 * Set the theme preference
	 */
	const setTheme = async (theme: Theme, event?: MouseEvent) => {
		currentTheme.value = theme;
		const computed = calculateAppliedTheme(theme);
		await applyThemeAnimated(computed, event);
		await themeItem.setValue(theme);
	};

	/**
	 * Toggle between light and dark (skips auto)
	 */
	const toggleTheme = async (event?: MouseEvent) => {
		const newTheme = appliedTheme.value === 'light' ? 'dark' : 'light';
		await setTheme(newTheme, event);
	};

	/**
	 * Initialize theme on mount
	 */
	const initTheme = async () => {
		// Load saved preference
		const saved = await themeItem.getValue();
		currentTheme.value = saved;

		// Apply initial theme
		const computed = calculateAppliedTheme(saved);
		applyTheme(computed);

		// Listen for system theme changes when in auto mode
		let mediaQueryCleanup: (() => void) | undefined;
		if (typeof window !== 'undefined' && window.matchMedia) {
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			const handleChange = () => {
				if (currentTheme.value === 'auto') {
					const newTheme = calculateAppliedTheme('auto');
					applyTheme(newTheme);
				}
			};

			// Modern browsers
			if (mediaQuery.addEventListener) {
				mediaQuery.addEventListener('change', handleChange);
				mediaQueryCleanup = () =>
					mediaQuery.removeEventListener('change', handleChange);
			} else {
				// Fallback for older browsers
				mediaQuery.addListener(handleChange);
				mediaQueryCleanup = () => mediaQuery.removeListener(handleChange);
			}
		}

		// Watch for external theme changes (e.g., from settings page)
		themeItem.watch((newTheme) => {
			currentTheme.value = newTheme;
			applyTheme(calculateAppliedTheme(newTheme));
		});

		return mediaQueryCleanup;
	};

	return {
		currentTheme,
		appliedTheme,
		setTheme,
		toggleTheme,
		initTheme,
	};
};
