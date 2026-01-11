import type { AppConfig } from "~types/config"

/**
 * Get the effective provider to use for AI operations.
 * If current provider has no API key, finds first configured provider.
 */
export function getEffectiveProvider(config: AppConfig): string | null {
    const providerSettings = config.providerSettings || {}

    // Check if current provider has API key
    if (providerSettings[config.provider]?.apiKey) {
        return config.provider
    }

    // Find first configured provider
    const configuredProviders = Object.entries(providerSettings)
        .filter(([_, settings]) => settings?.apiKey)
        .map(([name]) => name)

    return configuredProviders.length > 0 ? configuredProviders[0] : null
}

/**
 * Build a complete AI config from providerSettings.
 * Automatically uses the effective provider if current has no key.
 */
export function buildAIConfig(config: AppConfig): AppConfig | null {
    const effectiveProvider = getEffectiveProvider(config)

    if (!effectiveProvider) {
        return null // No configured provider
    }

    const providerConfig = config.providerSettings?.[effectiveProvider]
    if (!providerConfig?.apiKey) {
        return null
    }

    return {
        ...config,
        provider: effectiveProvider as AppConfig["provider"],
        apiKey: providerConfig.apiKey,
        baseUrl: providerConfig.baseUrl || config.baseUrl,
        model: providerConfig.model || config.model
    }
}
