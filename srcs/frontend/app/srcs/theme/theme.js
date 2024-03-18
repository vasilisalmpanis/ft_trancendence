export const useTheme = () => {
	const prf_dark = '(prefers-color-scheme: dark)';
	const setTheme = (theme) => {
		if (theme === 'auto') {
			document.documentElement.setAttribute(
				'data-bs-theme',
				(
					window.matchMedia(prf_dark).matches
					? 'dark'
					: 'light'
				)
			)
		} else {
			document.documentElement.setAttribute('data-bs-theme', theme)
			localStorage.setItem("theme", theme);
		}
	};
	let theme = localStorage.getItem("theme");
	if (!theme)
		theme = window.matchMedia(prf_dark).matches
			? 'dark'
			: 'light';
	return [theme, setTheme];
}