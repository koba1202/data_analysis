import matplotlib.pyplot as plt
import matplotlib.image as mpimg
from matplotlib.backends.backend_pdf import PdfPages


def slide_title(pdf):
    """スライド1: タイトル＋データ概要"""
    fig = plt.figure(figsize=(16, 9))
    fig.patch.set_facecolor("white")

    fig.text(
        0.5,
        0.78,
        "子どもの身体測定データの回帰分析",
        ha="center",
        fontsize=32,
        fontweight="bold",
    )
    fig.text(
        0.5,
        0.68,
        "単回帰の限界と交互作用項による改善",
        ha="center",
        fontsize=20,
        color="gray",
    )

    # データ概要
    data_text = (
        "使用データ\n"
        "\n"
        "wlchild.csv : 2,228件（age, length, weight）\n"
        "wlchild2.csv: 1,316件（+ ude[上腕囲], tekubi[手首囲]）\n"
        "\n"
        "length の単位は mm（例: 1022 = 102.2cm）"
    )
    fig.text(
        0.08,
        0.30,
        data_text,
        fontsize=16,
        verticalalignment="top",
        family="MS Gothic",
        bbox=dict(boxstyle="round,pad=0.5", facecolor="#e8f4fd", alpha=0.8),
    )

    # 相関図を小さく表示
    ax_img = fig.add_axes([0.58, 0.05, 0.38, 0.55])
    img = mpimg.imread("output/correlation.png")
    ax_img.imshow(img)
    ax_img.axis("off")
    ax_img.set_title("変数間の相関", fontsize=12)

    pdf.savefig(fig, dpi=150)
    plt.close()


def slide_regression(pdf):
    """スライド2: 単回帰分析の結果"""
    fig = plt.figure(figsize=(16, 9))
    fig.patch.set_facecolor("white")

    fig.text(0.5, 0.93, "単回帰分析の結果", ha="center", fontsize=28, fontweight="bold")

    # グラフ埋め込み
    ax_img = fig.add_axes([0.02, 0.15, 0.50, 0.70])
    img = mpimg.imread("output/02_age_weight.png")
    ax_img.imshow(img)
    ax_img.axis("off")

    # R2比較表
    ax_table = fig.add_axes([0.55, 0.15, 0.42, 0.70])
    ax_table.axis("off")

    models = ["age \u2192 weight", "age \u2192 length", "length \u2192 weight"]
    r2_values = [0.790, 0.916, 0.845]
    colors = ["#ff7f7f", "#7fbf7f", "#7f7fff"]

    for i, (name, r2, color) in enumerate(zip(models, r2_values, colors)):
        y = 0.85 - i * 0.30
        ax_table.text(
            0.0, y, name, fontsize=16, fontweight="bold", transform=ax_table.transAxes
        )
        ax_table.barh(
            y - 0.08,
            r2,
            height=0.06,
            color=color,
            alpha=0.7,
            transform=ax_table.transAxes,
        )
        ax_table.text(
            r2 + 0.02,
            y - 0.08,
            f"R\u00b2 = {r2:.3f}",
            fontsize=14,
            va="center",
            transform=ax_table.transAxes,
        )

    ax_table.text(
        0.0,
        0.05,
        "年齢だけでは体重の約21%が説明できない",
        fontsize=15,
        color="#cc0000",
        fontweight="bold",
        transform=ax_table.transAxes,
    )

    pdf.savefig(fig, dpi=150)
    plt.close()


def slide_interaction(pdf):
    """スライド3: 交互作用項による改善"""
    fig = plt.figure(figsize=(16, 9))
    fig.patch.set_facecolor("white")

    fig.text(
        0.5,
        0.93,
        "交互作用項で R\u00b2 が大幅改善",
        ha="center",
        fontsize=28,
        fontweight="bold",
    )

    # グラフ埋め込み
    ax_img = fig.add_axes([0.02, 0.35, 0.55, 0.55])
    img = mpimg.imread("output/03_interaction.png")
    ax_img.imshow(img)
    ax_img.axis("off")

    # R2推移の棒グラフ
    ax_bar = fig.add_axes([0.60, 0.35, 0.37, 0.55])
    labels = [
        "単回帰\n(age)",
        "多項式\n(age+age\u00b2)",
        "交互作用\n(age+length\n+age*length)",
    ]
    r2s = [0.790, 0.799, 0.903]
    bar_colors = ["#aaaaaa", "#7799cc", "#cc3333"]
    bars = ax_bar.barh(range(len(labels)), r2s, color=bar_colors, height=0.6)
    ax_bar.set_yticks(range(len(labels)))
    ax_bar.set_yticklabels(labels, fontsize=13)
    ax_bar.set_xlim(0, 1.05)
    ax_bar.set_xlabel("R\u00b2", fontsize=14)
    for bar, r2 in zip(bars, r2s):
        ax_bar.text(
            bar.get_width() + 0.01,
            bar.get_y() + bar.get_height() / 2,
            f"{r2:.3f}",
            va="center",
            fontsize=14,
            fontweight="bold",
        )
    ax_bar.invert_yaxis()
    ax_bar.set_title("モデル別 R\u00b2 比較", fontsize=14)

    # 注記
    fig.text(
        0.5,
        0.12,
        "研修の学び: 交互作用項の追加で R\u00b2 が 0.07 \u2192 0.54 に改善した例と同じ構造",
        ha="center",
        fontsize=14,
        style="italic",
        color="#555555",
    )
    fig.text(
        0.5,
        0.05,
        "+0.009（多項式）vs +0.113（交互作用）\u2192 変数の組み合わせが重要",
        ha="center",
        fontsize=15,
        fontweight="bold",
        color="#cc0000",
    )

    pdf.savefig(fig, dpi=150)
    plt.close()


def slide_extended(pdf):
    """スライド4: 追加変数の効果"""
    fig = plt.figure(figsize=(16, 9))
    fig.patch.set_facecolor("white")

    fig.text(
        0.5,
        0.93,
        "追加変数（上腕囲・手首囲）の効果",
        ha="center",
        fontsize=28,
        fontweight="bold",
    )

    # グラフ埋め込み
    ax_img = fig.add_axes([0.02, 0.20, 0.55, 0.65])
    img = mpimg.imread("output/04_extended.png")
    ax_img.imshow(img)
    ax_img.axis("off")

    # 比較テーブル
    ax_t = fig.add_axes([0.60, 0.30, 0.37, 0.55])
    ax_t.axis("off")

    ax_t.text(
        0.0,
        0.95,
        "モデル比較",
        fontsize=18,
        fontweight="bold",
        transform=ax_t.transAxes,
    )

    table_text = (
        "モデル1: age + length\n"
        "  R\u00b2 = 0.853 / AIC = 5,779\n"
        "\n"
        "モデル2: age + length + ude + tekubi\n"
        "  R\u00b2 = 0.886 / AIC = 5,448\n"
    )
    ax_t.text(
        0.0,
        0.75,
        table_text,
        fontsize=15,
        transform=ax_t.transAxes,
        verticalalignment="top",
        family="MS Gothic",
        bbox=dict(boxstyle="round,pad=0.5", facecolor="#f0f8e8", alpha=0.8),
    )

    ax_t.text(
        0.0,
        0.25,
        "上腕囲・手首囲の追加で\nR\u00b2 +0.033 / AIC -331",
        fontsize=16,
        fontweight="bold",
        color="#006600",
        transform=ax_t.transAxes,
    )

    pdf.savefig(fig, dpi=150)
    plt.close()


def slide_proposal(pdf):
    """スライド5: データ利活用の提案＋まとめ"""
    fig = plt.figure(figsize=(16, 9))
    fig.patch.set_facecolor("white")

    fig.text(
        0.5,
        0.93,
        "この分析から何ができるか？",
        ha="center",
        fontsize=28,
        fontweight="bold",
    )

    # 活用案
    proposals = [
        (
            "1. 成長異常の早期発見",
            "予測モデルから大きく外れる子どもを自動検出\n"
            "\u2192 発育不良・肥満の早期スクリーニング",
        ),
        (
            "2. 簡易測定での体重推定",
            "身長＋上腕囲だけで体重を R\u00b2=0.89 で推定可能\n"
            "\u2192 体重計がない環境（途上国の巡回健診等）での栄養評価",
        ),
        (
            "3. 成長曲線のパーソナライズ",
            "交互作用モデルで年齢\u00d7身長の関係を個別に捉える\n"
            "\u2192 画一的な成長曲線より精密な発育評価が可能に",
        ),
    ]

    bg_colors = ["#e8f4fd", "#fff3e0", "#e8f5e9"]
    for i, ((title, body), bg) in enumerate(zip(proposals, bg_colors)):
        y = 0.75 - i * 0.22
        fig.text(0.08, y, title, fontsize=18, fontweight="bold")
        fig.text(
            0.10,
            y - 0.04,
            body,
            fontsize=14,
            verticalalignment="top",
            bbox=dict(boxstyle="round,pad=0.4", facecolor=bg, alpha=0.8),
        )

    # まとめ
    summary = (
        "まとめ:  単回帰の限界(R\u00b2=0.79) \u2192 "
        "交互作用で改善(R\u00b2=0.90) \u2192 "
        "追加変数でさらに向上(R\u00b2=0.89)\n"
        "「データを集めるだけでなく、モデルの工夫で価値を生む」"
    )
    fig.text(
        0.5,
        0.08,
        summary,
        ha="center",
        fontsize=16,
        fontweight="bold",
        color="#333333",
        bbox=dict(boxstyle="round,pad=0.5", facecolor="#ffffcc", alpha=0.9),
    )

    pdf.savefig(fig, dpi=150)
    plt.close()


def main():
    plt.rcParams["font.family"] = "MS Gothic"

    with PdfPages("05_presentation.pdf") as pdf:
        slide_title(pdf)
        slide_regression(pdf)
        slide_interaction(pdf)
        slide_extended(pdf)
        slide_proposal(pdf)

    print("-> 05_presentation.pdf に保存しました（5ページ）")


if __name__ == "__main__":
    main()
