import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

const canWebShare =
  typeof navigator !== 'undefined' && typeof (navigator as Navigator).share === 'function';

// Whether the action button should be labeled as "Share" (vs. "Copy").
// Native always shares; web shares only if navigator.share is available.
export const canShare = Platform.OS !== 'web' || canWebShare;

// Returns true when the text was copied to clipboard (and the caller should
// show "Copiado!" feedback). Returns false when the OS share sheet handled it.
export async function shareOrCopy(text: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (canWebShare) {
      try {
        await (navigator as Navigator).share({ text });
        return false;
      } catch (err) {
        // User cancelled — bail without copying.
        if ((err as { name?: string } | null)?.name === 'AbortError') return false;
        // Other failure — fall through to clipboard.
      }
    }
    await Clipboard.setStringAsync(text);
    return true;
  }
  try {
    await Share.share({ message: text });
  } catch (_) {}
  return false;
}
