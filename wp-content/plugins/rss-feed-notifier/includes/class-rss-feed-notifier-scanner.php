<?php
/**
 * Cron and scanning logic for RSS Feed Notifier plugin.
 *
 * @package RSS_Feed_Notifier
 */

defined('ABSPATH') || exit;

if (!class_exists('SimplePie')) {
    require_once ABSPATH . WPINC . '/class-simplepie.php';
}

if (!function_exists('fetch_feed')) {
    require_once ABSPATH . WPINC . '/feed.php';
}

/**
 * Handles WP-Cron scheduling and feed scanning.
 */
class RSS_Feed_Notifier_Scanner {
    const CRON_HOOK = 'rss_feed_notifier_scan';
    const SENT_OPTION = 'rss_feed_notifier_sent_items';
    const STATUS_TRANSIENT = 'rss_feed_notifier_last_status';

    /**
     * Singleton instance.
     *
     * @var RSS_Feed_Notifier_Scanner|null
     */
    protected static $instance;

    /**
     * Returns singleton instance.
     *
     * @return RSS_Feed_Notifier_Scanner
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    /**
     * Hooks cron events and schedule updates.
     */
    protected function __construct() {
        add_action(self::CRON_HOOK, [$this, 'scan_feed']);
        add_action('update_option_' . RSS_Feed_Notifier_Admin::OPTION_NAME, [$this, 'maybe_reschedule'], 10, 2);
        add_filter('cron_schedules', [$this, 'register_custom_schedules']);
    }

    /**
     * Schedules cron event on plugin activation.
     */
    public static function activate() {
        $instance = self::get_instance();
        $frequency = $instance->get_frequency();

        if (!wp_next_scheduled(self::CRON_HOOK)) {
            wp_schedule_event(time(), $frequency, self::CRON_HOOK);
        }
    }

    /**
     * Removes cron event on plugin deactivation.
     */
    public static function deactivate() {
        wp_clear_scheduled_hook(self::CRON_HOOK);
    }

    /**
     * Registers additional cron schedules.
     *
     * @param array $schedules Existing schedules.
     *
     * @return array
     */
    public function register_custom_schedules($schedules) {
        $schedules['fifteen_minutes'] = [
            'interval' => 15 * MINUTE_IN_SECONDS,
            'display'  => esc_html__('Ogni 15 minuti', 'rss-feed-notifier'),
        ];

        return $schedules;
    }

    /**
     * Reschedules cron event when options change.
     *
     * @param array $old_value Previous options.
     * @param array $value     New options.
     */
    public function maybe_reschedule($old_value, $value) {
        $old_frequency = isset($old_value['frequency']) ? sanitize_key($old_value['frequency']) : '';
        $new_frequency = isset($value['frequency']) ? sanitize_key($value['frequency']) : '';

        if ($old_frequency === $new_frequency && wp_next_scheduled(self::CRON_HOOK)) {
            return;
        }

        wp_clear_scheduled_hook(self::CRON_HOOK);

        $frequency = $this->get_frequency($new_frequency);
        if (!wp_next_scheduled(self::CRON_HOOK)) {
            wp_schedule_event(time(), $frequency, self::CRON_HOOK);
        }
    }

    /**
     * Retrieves configured frequency or fallback to hourly.
     *
     * @param string $override Optional frequency to use.
     *
     * @return string
     */
    protected function get_frequency($override = '') {
        $available = array_keys(wp_get_schedules());
        $options   = RSS_Feed_Notifier_Admin::get_instance()->get_options();
        $frequency = $override ? $override : (isset($options['frequency']) ? $options['frequency'] : 'hourly');

        if (!in_array($frequency, $available, true)) {
            $frequency = 'hourly';
        }

        return $frequency;
    }

    /**
     * Cron callback entry point.
     */
    public function scan_feed() {
        $options = RSS_Feed_Notifier_Admin::get_instance()->get_options();

        if (empty($options['feed_url'])) {
            $this->set_status(__('Nessun URL del feed configurato.', 'rss-feed-notifier'));
            return;
        }

        $feed = fetch_feed($options['feed_url']);
        if (is_wp_error($feed)) {
            $message = sprintf(__('Errore nel recupero del feed: %s', 'rss-feed-notifier'), $feed->get_error_message());
            $this->set_status($message, ['code' => $feed->get_error_code()]);
            RSS_Feed_Notifier_Logger::log($message, ['code' => $feed->get_error_code()]);
            return;
        }

        $maxitems = $feed->get_item_quantity();
        if (!$maxitems) {
            $this->set_status(__('Nessun elemento trovato nel feed.', 'rss-feed-notifier'));
            return;
        }

        $items        = $feed->get_items(0, $maxitems);
        $sent         = (array) get_option(self::SENT_OPTION, []);
        $keywords     = $this->prepare_list($options['keywords']);
        $categories   = $this->prepare_list($options['categories']);
        $recipients   = $this->prepare_recipients($options['recipients']);
        $email_sender = sanitize_email($options['email_sender']);

        if (empty($recipients)) {
            $this->set_status(__('Nessun destinatario valido configurato.', 'rss-feed-notifier'));
            return;
        }

        $sent_count = 0;

        foreach ($items as $item) {
            if (!$item instanceof SimplePie_Item) {
                continue;
            }

            $guid = $item->get_id(true);
            if (!$guid) {
                $guid = $item->get_permalink();
            }

            if (!$guid || in_array($guid, $sent, true)) {
                continue;
            }

            if (!$this->match_filters($item, $keywords, $categories)) {
                continue;
            }

            $content = $this->fetch_full_content($item->get_permalink());

            if (empty($content)) {
                RSS_Feed_Notifier_Logger::log('Contenuto vuoto, skip item', ['guid' => $guid]);
                continue;
            }

            $mail_subject = apply_filters(
                'rss_feed_notifier_email_subject',
                sprintf(__('Nuovo articolo: %s', 'rss-feed-notifier'), $item->get_title()),
                $item
            );

            $mail_body = apply_filters(
                'rss_feed_notifier_email_body',
                $this->build_email_body($item, $content),
                $item,
                $content
            );

            $headers = ['Content-Type: text/html; charset=UTF-8'];
            if (!empty($email_sender)) {
                $headers[] = 'From: ' . $email_sender;
            }

            /**
             * Filter: allows customizing the list of recipients.
             *
             * @param array         $recipients Array of sanitized email addresses.
             * @param SimplePie_Item $item       Item about to be sent.
             */
            $filtered_recipients = apply_filters('rss_feed_notifier_recipients', $recipients, $item);

            if (empty($filtered_recipients)) {
                continue;
            }

            $sent_mail = wp_mail($filtered_recipients, $mail_subject, $mail_body, $headers);

            if (!$sent_mail) {
                RSS_Feed_Notifier_Logger::log('Invio email fallito', ['guid' => $guid]);
                continue;
            }

            $sent[] = $guid;
            $sent_count++;

            /**
             * Action: fires when an item has been sent via email.
             *
             * @param SimplePie_Item $item Item just sent.
             */
            do_action('rss_feed_notifier_item_sent', $item);
        }

        $sent = array_slice(array_unique($sent), -200, 200); // keep last 200 entries to limit storage.
        update_option(self::SENT_OPTION, $sent, false);

        $message = sprintf(_n('%d elemento notificato.', '%d elementi notificati.', $sent_count, 'rss-feed-notifier'), $sent_count);
        $this->set_status($message);
    }

    /**
     * Saves status message as transient for admin display and logs it.
     *
     * @param string $message Status message.
     * @param array  $context Extra context.
     */
    protected function set_status($message, array $context = []) {
        if (empty($message)) {
            return;
        }

        set_transient(self::STATUS_TRANSIENT, $message, 30 * MINUTE_IN_SECONDS);
        RSS_Feed_Notifier_Logger::log($message, $context);
    }

    /**
     * Converts newline-separated list into array of lowercase strings.
     *
     * @param string $value Text area value.
     *
     * @return array
     */
    protected function prepare_list($value) {
        $value = (string) $value;
        if ('' === $value) {
            return [];
        }

        $items = preg_split("/[\r\n,]+/", $value);
        $items = array_map('sanitize_text_field', $items);
        $items = array_filter($items);
        $items = array_map([$this, 'lowercase'], $items);

        return array_unique($items);
    }

    /**
     * Converts recipients list into array of valid email addresses.
     *
     * @param string $value Text area value.
     *
     * @return array
     */
    protected function prepare_recipients($value) {
        $value = (string) $value;
        if ('' === $value) {
            return [];
        }

        $raw = preg_split("/[\r\n,;]+/", $value);
        $emails = [];

        foreach ($raw as $email) {
            $email = sanitize_email($email);
            if (!empty($email) && is_email($email)) {
                $emails[] = $email;
            }
        }

        return array_values(array_unique($emails));
    }

    /**
     * Checks whether feed item matches configured filters.
     *
     * @param SimplePie_Item $item       Feed item.
     * @param array          $keywords   Keywords to look for.
     * @param array          $categories Categories to require.
     *
     * @return bool
     */
    protected function match_filters(SimplePie_Item $item, array $keywords, array $categories) {
        if (!empty($categories)) {
            $item_categories = [];
            foreach ((array) $item->get_categories() as $category) {
                if ($category instanceof SimplePie_Category) {
                    $item_categories[] = $this->lowercase($category->get_term());
                }
            }

            if (empty(array_intersect($categories, $item_categories))) {
                return false;
            }
        }

        if (!empty($keywords)) {
            $haystack = $this->lowercase($item->get_title() . ' ' . $item->get_description());
            $match    = false;

            foreach ($keywords as $keyword) {
                if (false !== strpos($haystack, $keyword)) {
                    $match = true;
                    break;
                }
            }

            if (!$match) {
                return false;
            }
        }

        $is_match = true;

        /**
         * Filter: allows overriding the filter logic for items.
         *
         * @param bool           $is_match   Whether the item matches the filters.
         * @param SimplePie_Item $item       Feed item.
         * @param array          $keywords   Keywords list.
         * @param array          $categories Categories list.
         */
        return apply_filters('rss_feed_notifier_item_is_match', $is_match, $item, $keywords, $categories);
    }

    /**
     * Fetches the full content of the article linked in the item.
     *
     * @param string $url Article URL.
     *
     * @return string Sanitized HTML content.
     */
    protected function fetch_full_content($url) {
        $response = wp_remote_get(esc_url_raw($url), ['timeout' => 15]);
        if (is_wp_error($response)) {
            RSS_Feed_Notifier_Logger::log('Errore recuperando il contenuto', [
                'url'   => esc_url_raw($url),
                'error' => $response->get_error_message(),
            ]);

            return '';
        }

        $body = wp_remote_retrieve_body($response);
        if (empty($body)) {
            return '';
        }

        $content = $this->extract_main_text($body);

        if (empty($content)) {
            $content = wp_strip_all_tags($body);
        }

        $content = wp_kses_post(wpautop(trim($content)));

        return $content;
    }

    /**
     * Extracts main text content from HTML response using DOMDocument.
     *
     * @param string $html Raw HTML content.
     *
     * @return string
     */
    protected function extract_main_text($html) {
        if ('' === trim($html)) {
            return '';
        }

        $internal_errors = libxml_use_internal_errors(true);

        $dom = new DOMDocument();
        $encoding_list = function_exists('mb_detect_order') ? mb_detect_order() : null;
        if (!is_array($encoding_list)) {
            $encoding_list = null;
        }

        $encoding = function_exists('mb_detect_encoding') ? mb_detect_encoding($html, $encoding_list, true) : false;
        if ($encoding && function_exists('mb_convert_encoding')) {
            $html = mb_convert_encoding($html, 'HTML-ENTITIES', $encoding);
        }

        $loaded = $dom->loadHTML($html, LIBXML_NOERROR | LIBXML_NOWARNING);
        libxml_clear_errors();
        libxml_use_internal_errors($internal_errors);

        if (!$loaded) {
            return '';
        }

        $xpath = new DOMXPath($dom);
        $nodes = $xpath->query('//article//p | //main//p');

        if (!$nodes || 0 === $nodes->length) {
            $nodes = $xpath->query('//p');
        }

        $paragraphs = [];
        foreach ($nodes as $node) {
            $text = trim($node->textContent);
            if ($text !== '') {
                $paragraphs[] = $text;
            }
        }

        $paragraphs = array_slice($paragraphs, 0, 20);

        return implode("\n\n", $paragraphs);
    }

    /**
     * Multibyte-safe lowercase conversion helper.
     *
     * @param string $value Input string.
     *
     * @return string
     */
    protected function lowercase($value) {
        if (function_exists('mb_strtolower')) {
            return mb_strtolower((string) $value);
        }

        return strtolower((string) $value);
    }

    /**
     * Builds HTML email body.
     *
     * @param SimplePie_Item $item    Feed item.
     * @param string         $content Extracted content.
     *
     * @return string HTML body.
     */
    protected function build_email_body(SimplePie_Item $item, $content) {
        $permalink = esc_url($item->get_permalink());
        $title     = esc_html($item->get_title());
        $content   = apply_filters('rss_feed_notifier_email_content', $content, $item);

        $body  = '<h2>' . $title . '</h2>';
        $body .= '<div>' . $content . '</div>';
        $body .= '<p><a href="' . $permalink . '">' . esc_html__('Leggi l\'articolo completo', 'rss-feed-notifier') . '</a></p>';

        return $body;
    }
}

