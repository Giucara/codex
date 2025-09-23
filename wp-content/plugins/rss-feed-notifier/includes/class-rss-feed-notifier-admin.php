<?php
/**
 * Admin UI for RSS Feed Notifier plugin.
 *
 * @package RSS_Feed_Notifier
 */

defined('ABSPATH') || exit;

/**
 * Handles the settings page and options registration via the WordPress Settings API.
 */
class RSS_Feed_Notifier_Admin {
    const OPTION_NAME = 'rss_feed_notifier_options';

    /**
     * Singleton instance.
     *
     * @var RSS_Feed_Notifier_Admin|null
     */
    protected static $instance;

    /**
     * Returns the singleton instance.
     *
     * @return RSS_Feed_Notifier_Admin
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    /**
     * Hooks into WordPress actions for the Settings API.
     */
    protected function __construct() {
        add_action('admin_menu', [$this, 'add_settings_page']);
        add_action('admin_init', [$this, 'register_settings']);
    }

    /**
     * Adds the Settings → RSS Notifier page.
     */
    public function add_settings_page() {
        add_options_page(
            esc_html__('RSS Notifier', 'rss-feed-notifier'),
            esc_html__('RSS Notifier', 'rss-feed-notifier'),
            'manage_options',
            'rss-feed-notifier',
            [$this, 'render_settings_page']
        );
    }

    /**
     * Registers plugin settings, sections and fields.
     */
    public function register_settings() {
        register_setting(
            'rss_feed_notifier',
            self::OPTION_NAME,
            [
                'sanitize_callback' => [$this, 'sanitize_options'],
                'default'           => $this->get_default_options(),
            ]
        );

        add_settings_section(
            'rss_feed_notifier_feed_section',
            esc_html__('Feed', 'rss-feed-notifier'),
            '__return_false',
            'rss-feed-notifier'
        );

        add_settings_field(
            'feed_url',
            esc_html__('Feed URL', 'rss-feed-notifier'),
            [$this, 'render_text_field'],
            'rss-feed-notifier',
            'rss_feed_notifier_feed_section',
            [
                'label_for'   => 'feed_url',
                'option_name' => 'feed_url',
                'description' => esc_html__('Inserisci l\'URL completo del feed RSS da monitorare.', 'rss-feed-notifier'),
            ]
        );

        add_settings_section(
            'rss_feed_notifier_filters_section',
            esc_html__('Filtri', 'rss-feed-notifier'),
            '__return_false',
            'rss-feed-notifier'
        );

        add_settings_field(
            'keywords',
            esc_html__('Parole chiave', 'rss-feed-notifier'),
            [$this, 'render_textarea_field'],
            'rss-feed-notifier',
            'rss_feed_notifier_filters_section',
            [
                'label_for'   => 'keywords',
                'option_name' => 'keywords',
                'description' => esc_html__('Elenco di parole chiave (una per riga) che devono comparire nel titolo o nella descrizione dell\'elemento.', 'rss-feed-notifier'),
            ]
        );

        add_settings_field(
            'categories',
            esc_html__('Categorie', 'rss-feed-notifier'),
            [$this, 'render_textarea_field'],
            'rss-feed-notifier',
            'rss_feed_notifier_filters_section',
            [
                'label_for'   => 'categories',
                'option_name' => 'categories',
                'description' => esc_html__('Categorie richieste (una per riga). Lascia vuoto per non filtrare per categoria.', 'rss-feed-notifier'),
            ]
        );

        add_settings_section(
            'rss_feed_notifier_notifications_section',
            esc_html__('Notifiche', 'rss-feed-notifier'),
            '__return_false',
            'rss-feed-notifier'
        );

        add_settings_field(
            'recipients',
            esc_html__('Destinatari', 'rss-feed-notifier'),
            [$this, 'render_textarea_field'],
            'rss-feed-notifier',
            'rss_feed_notifier_notifications_section',
            [
                'label_for'   => 'recipients',
                'option_name' => 'recipients',
                'description' => esc_html__('Indirizzi email destinatari (uno per riga o separati da virgole).', 'rss-feed-notifier'),
            ]
        );

        add_settings_field(
            'email_sender',
            esc_html__('Mittente email', 'rss-feed-notifier'),
            [$this, 'render_text_field'],
            'rss-feed-notifier',
            'rss_feed_notifier_notifications_section',
            [
                'label_for'   => 'email_sender',
                'option_name' => 'email_sender',
                'description' => esc_html__('Facoltativo: indirizzo email da usare come mittente.', 'rss-feed-notifier'),
            ]
        );

        add_settings_section(
            'rss_feed_notifier_schedule_section',
            esc_html__('Frequenza di scansione', 'rss-feed-notifier'),
            '__return_false',
            'rss-feed-notifier'
        );

        add_settings_field(
            'frequency',
            esc_html__('Frequenza', 'rss-feed-notifier'),
            [$this, 'render_frequency_field'],
            'rss-feed-notifier',
            'rss_feed_notifier_schedule_section',
            [
                'label_for'   => 'frequency',
                'option_name' => 'frequency',
                'description' => esc_html__('Intervallo con cui pianificare la scansione del feed.', 'rss-feed-notifier'),
            ]
        );
    }

    /**
     * Returns default options.
     *
     * @return array
     */
    protected function get_default_options() {
        return [
            'feed_url'     => '',
            'keywords'     => '',
            'categories'   => '',
            'recipients'   => '',
            'email_sender' => '',
            'frequency'    => 'hourly',
        ];
    }

    /**
     * Retrieves plugin options merged with defaults.
     *
     * @return array
     */
    public function get_options() {
        $defaults = $this->get_default_options();
        $options  = (array) get_option(self::OPTION_NAME, $defaults);

        return wp_parse_args($options, $defaults);
    }

    /**
     * Sanitizes options before saving.
     *
     * @param array $input Raw input.
     *
     * @return array Sanitized values.
     */
    public function sanitize_options($input) {
        $defaults = $this->get_default_options();
        $input    = wp_parse_args((array) $input, $defaults);

        $input['feed_url']     = esc_url_raw($input['feed_url']);
        $input['keywords']     = $this->sanitize_textarea($input['keywords']);
        $input['categories']   = $this->sanitize_textarea($input['categories']);
        $input['recipients']   = $this->sanitize_textarea($input['recipients']);
        $input['email_sender'] = sanitize_email($input['email_sender']);
        $input['frequency']    = sanitize_key($input['frequency']);

        /**
         * Filters sanitized options before saving them to the database.
         *
         * @param array $input    Sanitized input.
         * @param array $defaults Default values.
         */
        return apply_filters('rss_feed_notifier_sanitized_options', $input, $defaults);
    }

    /**
     * Sanitizes a textarea field preserving line breaks.
     *
     * @param string $value Raw textarea value.
     *
     * @return string
     */
    protected function sanitize_textarea($value) {
        $lines = preg_split("/[\r\n]+/", (string) $value);
        $lines = array_map('sanitize_text_field', $lines);
        $lines = array_filter($lines);

        return implode("\n", $lines);
    }

    /**
     * Renders a text input field.
     *
     * @param array $args Field arguments.
     */
    public function render_text_field($args) {
        $options = $this->get_options();
        $name    = esc_attr($args['option_name']);
        $value   = isset($options[$name]) ? $options[$name] : '';

        printf(
            '<input type="text" id="%1$s" name="%2$s[%1$s]" value="%3$s" class="regular-text" />',
            esc_attr($args['label_for']),
            esc_attr(self::OPTION_NAME),
            esc_attr($value)
        );

        if (!empty($args['description'])) {
            printf('<p class="description">%s</p>', esc_html($args['description']));
        }
    }

    /**
     * Renders a textarea field.
     *
     * @param array $args Field arguments.
     */
    public function render_textarea_field($args) {
        $options = $this->get_options();
        $name    = esc_attr($args['option_name']);
        $value   = isset($options[$name]) ? $options[$name] : '';

        printf(
            '<textarea id="%1$s" name="%2$s[%1$s]" rows="5" class="large-text code">%3$s</textarea>',
            esc_attr($args['label_for']),
            esc_attr(self::OPTION_NAME),
            esc_textarea($value)
        );

        if (!empty($args['description'])) {
            printf('<p class="description">%s</p>', esc_html($args['description']));
        }
    }

    /**
     * Renders frequency select field with available schedules.
     *
     * @param array $args Field arguments.
     */
    public function render_frequency_field($args) {
        $options    = $this->get_options();
        $value      = isset($options['frequency']) ? $options['frequency'] : 'hourly';
        $schedules  = wp_get_schedules();
        $schedules  = apply_filters('rss_feed_notifier_available_schedules', $schedules);

        printf(
            '<select id="%1$s" name="%2$s[%1$s]">',
            esc_attr($args['label_for']),
            esc_attr(self::OPTION_NAME)
        );

        foreach ($schedules as $schedule_key => $schedule) {
            printf(
                '<option value="%1$s" %2$s>%3$s</option>',
                esc_attr($schedule_key),
                selected($value, $schedule_key, false),
                esc_html($schedule['display'])
            );
        }

        echo '</select>';

        if (!empty($args['description'])) {
            printf('<p class="description">%s</p>', esc_html($args['description']));
        }
    }

    /**
     * Renders settings page markup.
     */
    public function render_settings_page() {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('Non hai i permessi necessari per accedere a questa pagina.', 'rss-feed-notifier'));
        }

        $options     = $this->get_options();
        $last_status = get_transient('rss_feed_notifier_last_status');

        echo '<div class="wrap">';
        echo '<h1>' . esc_html__('RSS Feed Notifier', 'rss-feed-notifier') . '</h1>';

        if ($last_status) {
            printf('<div class="notice notice-info"><p>%s</p></div>', esc_html($last_status));
        }

        echo '<form action="options.php" method="post">';
        settings_fields('rss_feed_notifier');
        do_settings_sections('rss-feed-notifier');
        submit_button();
        echo '</form>';

        /**
         * Action: allows developers to extend the settings page output.
         *
         * @param array $options Current plugin options.
         */
        do_action('rss_feed_notifier_after_settings_form', $options);

        echo '</div>';
    }
}

