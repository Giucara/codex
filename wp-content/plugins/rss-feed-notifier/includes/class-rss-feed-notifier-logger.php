<?php
/**
 * Simple logger utility for RSS Feed Notifier.
 *
 * @package RSS_Feed_Notifier
 */

defined('ABSPATH') || exit;

/**
 * Basic logger wrapper around error_log allowing filters for customization.
 */
class RSS_Feed_Notifier_Logger {
    /**
     * Logs a message and optional context using WordPress' error_log.
     *
     * @param string $message Message to log.
     * @param array  $context Additional data to attach to the message.
     */
    public static function log($message, array $context = []) {
        $message = apply_filters('rss_feed_notifier_log_message', $message, $context);
        if (empty($message)) {
            return;
        }

        if (!empty($context)) {
            $context = wp_json_encode($context, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            if (false !== $context) {
                $message = sprintf('%s | %s', $message, $context);
            }
        }

        error_log($message); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
    }
}

