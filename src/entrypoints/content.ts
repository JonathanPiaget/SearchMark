import { isQuickSaveShortcut } from '../utils/keyboard';

export default defineContentScript({
	matches: ['<all_urls>'],
	main() {
		const showNotification = (message: string, isError = false) => {
			const notification = document.createElement('div');
			notification.textContent = message;
			notification.style.cssText = `
				position: fixed;
				top: 20px;
				right: 20px;
				background: ${isError ? '#f44336' : '#4CAF50'};
				color: white;
				padding: 12px 20px;
				border-radius: 4px;
				z-index: 10000;
				font-family: Arial, sans-serif;
				font-size: 14px;
				box-shadow: 0 2px 10px rgba(0,0,0,0.2);
			`;
			document.body.appendChild(notification);

			setTimeout(() => {
				notification.remove();
			}, 2000);
		};

		const saveBookmark = async () => {
			try {
				const response = await browser.runtime.sendMessage({
					action: 'saveBookmark',
					title: document.title,
					url: window.location.href,
				});

				if (response.success) {
					showNotification('Bookmark saved!');
				} else {
					showNotification('Error saving bookmark', true);
				}
			} catch (error) {
				console.error('Error saving bookmark:', error);
				showNotification('Error saving bookmark', true);
			}
		};

		const handleKeydown = (event: KeyboardEvent) => {
			if (isQuickSaveShortcut(event)) {
				event.preventDefault();
				saveBookmark();
			}
		};

		// Listen for messages from popup
		browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
			if (message.type === 'SHOW_NOTIFICATION') {
				showNotification(message.message, message.isError);
				sendResponse({ success: true });
			}
		});

		document.addEventListener('keydown', handleKeydown);
	},
});
