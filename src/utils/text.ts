
/**
 * 智能截断文本，根据语言类型（CJK vs Latin）采用不同的截断策略
 * Ported from SmartBookmark
 */
export function smartTruncate(text: string, maxLength: number = 500): string {
    if (!text) return text
    if (text.length <= maxLength) return text

    // 检测文本类型的辅助函数
    const detectTextType = (text: string) => {
        // 统计前100个字符的语言特征
        const sample = text.slice(0, 100)

        // 统计不同类型字符的数量
        const stats = {
            latin: 0, // 拉丁字母 (英文等)
            cjk: 0, // 中日韩文字
            cyrillic: 0, // 西里尔字母 (俄文等)
            arabic: 0, // 阿拉伯文
            other: 0 // 其他字符
        }

        // 遍历样本文本的每个字符
        for (const char of sample) {
            if (/[\p{Script=Latin}]/u.test(char)) {
                stats.latin++
            } else if (
                /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(
                    char
                )
            ) {
                stats.cjk++
            } else if (/[\p{Script=Cyrillic}]/u.test(char)) {
                stats.cyrillic++
            } else if (/[\p{Script=Arabic}]/u.test(char)) {
                stats.arabic++
            } else if (!/[\s\p{P}]/u.test(char)) {
                // 排除空格和标点
                stats.other++
            }
        }

        // 计算主要字符类型的占比
        const total = Object.values(stats).reduce((a, b) => a + b, 0)
        const threshold = 0.6 // 60%的阈值

        // 返回主要语言类型
        if (stats.latin / total > threshold) return "latin"
        if (stats.cjk / total > threshold) return "cjk"
        if (stats.cyrillic / total > threshold) return "cyrillic"
        if (stats.arabic / total > threshold) return "arabic"

        // 如果没有明显主导的语言类型，返回混合类型
        return "mixed"
    }

    const textType = detectTextType(text)
    // console.debug('Text Type:', textType);

    // 根据不同语言类型选择截取策略
    switch (textType) {
        case "latin":
        case "cyrillic":
        case "arabic":
            // 按单词数量截取
            const maxWords = Math.round(maxLength * 0.5)
            const words = text.split(/\s+/).filter((word) => word.length > 0)
            if (words.length <= maxWords) return text

            return words.slice(0, maxWords).join(" ")
        case "cjk":
            // 中日韩文本按字符截取，在标点处断句
            const punctuation = /[，。！？；,!?;]/
            let truncated = text.slice(0, maxLength)

            // 尝试在标点符号处截断
            for (let i = truncated.length - 1; i >= maxLength - 50; i--) {
                if (punctuation.test(truncated[i])) {
                    truncated = truncated.slice(0, i + 1)
                    break
                }
            }
            return truncated

        case "mixed":
        default:
            // 混合文本采用通用策略
            // 先尝试在空格处截断
            let mixedTruncated = text.slice(0, maxLength)
            for (let i = mixedTruncated.length - 1; i >= maxLength - 30; i--) {
                if (/\s/.test(mixedTruncated[i])) {
                    mixedTruncated = mixedTruncated.slice(0, i)
                    break
                }
            }
            return mixedTruncated
    }
}
