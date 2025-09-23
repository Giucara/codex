<?php
/**
 * Plugin Name: RSS Feed Notifier
 * Plugin URI: https://example.com/plugins/rss-feed-notifier
 * Description: Recupera un feed RSS, filtra gli elementi in base ai criteri configurati e invia notifiche email con il contenuto completo degli articoli.
 * Version: 1.0.0
 * Author: Codex Team
 * Author URI: https://example.com
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: rss-feed-notifier
 * Domain Path: /languages
 */

defined('ABSPATH') || exit;

define('RSS_FEED_NOTIFIER_VERSION', '1.0.0');
define('RSS_FEED_NOTIFIER_PLUGIN_FILE', __FILE__);
define('RSS_FEED_NOTIFIER_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('RSS_FEED_NOTIFIER_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once RSS_FEED_NOTIFIER_PLUGIN_DIR . 'includes/class-rss-feed-notifier-logger.php';
require_once RSS_FEED_NOTIFIER_PLUGIN_DIR . 'includes/class-rss-feed-notifier-admin.php';
require_once RSS_FEED_NOTIFIER_PLUGIN_DIR . 'includes/class-rss-feed-notifier-scanner.php';

register_activation_hook(__FILE__, ['RSS_Feed_Notifier_Scanner', 'activate']);
register_deactivation_hook(__FILE__, ['RSS_Feed_Notifier_Scanner', 'deactivate']);

add_action('plugins_loaded', function () {
    RSS_Feed_Notifier_Admin::get_instance();
    RSS_Feed_Notifier_Scanner::get_instance();
});

