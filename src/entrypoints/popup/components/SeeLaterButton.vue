<template>
  <button
    class="see-later-button"
    :aria-label="i18n.t('seeLater')"
    :title="i18n.t('seeLaterTooltip')"
    :disabled="isLoading"
    @click="handleSeeLater"
  >
    <span class="see-later-icon" :class="{ loading: isLoading }">
      🕐
    </span>
  </button>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { i18n } from '#i18n';
import { useSeeLater } from '../../../composables/useSeeLater';

const { getOrCreateSeeLaterFolder } = useSeeLater();
const isLoading = ref(false);

const handleSeeLater = async () => {
	isLoading.value = true;
	try {
		// 1. Get or create See Later folder (now returns folder object)
		const folder = await getOrCreateSeeLaterFolder();

		// 2. Get current tab info
		const [tab] = await browser.tabs.query({
			active: true,
			currentWindow: true,
		});
		if (!tab?.url || !tab?.title) {
			throw new Error('No active tab found');
		}

		// 3. Save bookmark
		await browser.bookmarks.create({
			title: tab.title,
			url: tab.url,
			parentId: folder.id,
		});

		// 4. Show success notification
		try {
			if (tab.id) {
				await browser.tabs.sendMessage(tab.id, {
					type: 'SHOW_NOTIFICATION',
					message: i18n
						.t('seeLaterSuccess')
						.replace('{folderName}', folder.title),
					isError: false,
				});
			}
		} catch {
			// Silently ignore notification errors - bookmark was still saved successfully
			console.log(
				'Could not show notification (content script not available on this page)',
			);
		}

		// 5. Close popup
		window.close();
	} catch (error) {
		console.error('See Later save failed:', error);

		// Show error notification to user
		try {
			const [tab] = await browser.tabs.query({
				active: true,
				currentWindow: true,
			});
			if (tab?.id) {
				await browser.tabs.sendMessage(tab.id, {
					type: 'SHOW_NOTIFICATION',
					message: i18n.t('seeLaterError'),
					isError: true,
				});
			}
		} catch (notificationError) {
			// If notification fails, just log it
			console.log('Could not show error notification:', notificationError);
		}

		// Don't close popup on error - let user try again
	} finally {
		isLoading.value = false;
	}
};
</script>

<style scoped>
.see-later-button {
  background: transparent;
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 32px;
}

.see-later-button:hover:not(:disabled) {
  background: var(--bg-tertiary);
  border-color: var(--accent-primary);
  transform: scale(1.05);
}

.see-later-button:active:not(:disabled) {
  transform: scale(0.95);
}

.see-later-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.see-later-icon {
  font-size: 16px;
  transition: transform 0.3s ease;
  display: inline-block;
}

.see-later-icon.loading {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
