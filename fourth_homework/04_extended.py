import pandas as pd
import matplotlib.pyplot as plt
import statsmodels.api as sm


def print_model_summary(model, name, var_names):
    """モデルの主要統計量を表示"""
    print(f"\n{'=' * 50}")
    print(f"【{name}】")
    print(f"  R2      = {model.rsquared:.4f}")
    print(f"  Adj. R2 = {model.rsquared_adj:.4f}")
    print(f"  AIC     = {model.aic:.1f}")
    print(f"  観測数  = {model.nobs:.0f}")
    print(f"  {'変数':<15} {'係数':>12} {'p値':>12}")
    print(f"  {'-' * 40}")
    for i, name_v in enumerate(var_names):
        print(f"  {name_v:<15} {model.params[i]:>12.4f} {model.pvalues[i]:>12.2e}")


def main():
    plt.rcParams["font.family"] = "MS Gothic"

    # データ読み込み
    df = pd.read_csv("data/wlchild2.csv").dropna()
    print(f"データ件数: {len(df)}")

    # --- 基本統計量 ---
    print(f"\n{'=' * 50}")
    print("【基本統計量】")
    print(df.describe().round(2).to_string())

    # --- 相関行列 ---
    print(f"\n{'=' * 50}")
    print("【相関行列】")
    print(df.corr().round(3).to_string())

    y = df["weight"].values

    # --- モデル1: age + length -> weight ---
    X1 = sm.add_constant(df[["age", "length"]].values)
    model1 = sm.OLS(y, X1).fit()
    print_model_summary(
        model1, "モデル1: age + length -> weight", ["切片", "age", "length"]
    )

    # --- モデル2: age + length + ude + tekubi -> weight ---
    X2 = sm.add_constant(df[["age", "length", "ude", "tekubi"]].values)
    model2 = sm.OLS(y, X2).fit()
    print_model_summary(
        model2,
        "モデル2: age + length + ude + tekubi -> weight",
        ["切片", "age", "length", "ude", "tekubi"],
    )

    # --- モデル3: age + length + ude + tekubi -> weight ---
    X3 = sm.add_constant(df[["length", "tekubi"]].values)
    model3 = sm.OLS(y, X3).fit()
    print_model_summary(
        model3,
        "モデル2: length + tekubi -> weight",
        ["切片", "length", "tekubi"],
    )

    # --- モデル比較 ---
    print(f"\n{'=' * 50}")
    print("【モデル比較】")
    print(f"  {'モデル':<40} {'R2':>8} {'Adj.R2':>8} {'AIC':>10}")
    print(f"  {'-' * 68}")
    rows = [
        ("age + length", model1),
        ("age + length + ude + tekubi", model2),
        ("age + length + tekubi", model3),

    ]
    for name, m in rows:
        print(f"  {name:<40} {m.rsquared:>8.4f} {m.rsquared_adj:>8.4f} {m.aic:>10.1f}")

    # --- 可視化 ---
    _, axes = plt.subplots(1, 2, figsize=(14, 6))

    # 左: モデル1 予測値 vs 実測値
    ax = axes[0]
    y_pred1 = model1.fittedvalues
    ax.scatter(y_pred1, y, alpha=0.3, s=10)
    lims = [min(y.min(), y_pred1.min()), max(y.max(), y_pred1.max())]
    ax.plot(lims, lims, color="red", linestyle="--", linewidth=1)
    ax.set_title(f"モデル1: age+length（R\u00b2={model1.rsquared:.3f}）")
    ax.set_xlabel("予測値（weight）")
    ax.set_ylabel("実測値（weight）")

    # 右: モデル2 予測値 vs 実測値
    ax = axes[1]
    y_pred2 = model2.fittedvalues
    ax.scatter(y_pred2, y, alpha=0.3, s=10)
    lims = [min(y.min(), y_pred2.min()), max(y.max(), y_pred2.max())]
    ax.plot(lims, lims, color="red", linestyle="--", linewidth=1)
    ax.set_title(f"モデル2: age+length+ude+tekubi（R\u00b2={model2.rsquared:.3f}）")
    ax.set_xlabel("予測値（weight）")
    ax.set_ylabel("実測値（weight）")

    plt.tight_layout()
    plt.savefig("output/04_extended.png")
    plt.close()
    print("\n-> output/04_extended.png に保存しました")


if __name__ == "__main__":
    main()
