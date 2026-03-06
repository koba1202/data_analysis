## プロジェクト概要

研修の宿題プロジェクト。子どもの身体測定データ（CSV 2種）に対して回帰分析を行い、データから読み取れることを次回研修で発表する。

## 研修で学んだこと

- 単回帰分析の基礎
- 交互作用項を加えることで R² が大きく改善するケースがある（例: 0.07 → 0.54）
- 研修での例: 部署ごとの時間外労働時間の単回帰、時間外労働時間と勤続年数の回帰

## データ

| ファイル | 件数 | カラム |
|---|---|---|
| `data/wlchild.csv` | 2,228行 | age（年齢）, length（身長mm）, weight（体重kg） |
| `data/wlchild2.csv` | 1,316行 | age, length, weight, ude（上腕囲）, tekubi（手首囲） |

- wlchild2 は wlchild のサブセットに ude, tekubi を追加した構成
- length の単位は mm（例: 1022 = 102.2cm）

## ディレクトリ構成

```
homework/
├── CLAUDE.md
├── venv/
├── requirements.txt
├── data/
│   ├── wlchild.csv
│   └── wlchild2.csv
├── 01_eda.py           # Phase 1: 探索的データ分析
├── 02_simple_reg.py    # Phase 2: 単回帰分析
├── 03_interaction.py   # Phase 3: 交互作用・多項式回帰
├── 04_extended.py      # Phase 4: 追加変数（ude, tekubi）を使った分析
└── outputs/            # グラフ・レポートの出力先
```

## 開発ルール

- Python 3 + venv 環境を使用(`venv\Scripts\activate && pip install -r requirements.txt`)
- 主要ライブラリ: pandas, numpy, matplotlib, seaborn, statsmodels, scikit-learn
- グラフは日本語表示対応すること（matplotlib の `rcParams` でフォント設定）
- グラフ・結果は `outputs/` に保存する
- 各スクリプトは単体で実行可能にする（`python 01_eda.py` で動く）
- printで主要な統計量（R², 係数, p値など）をコンソールに出力する

## 分析の方針

1. まず EDA で全体像を把握する
2. 単回帰で「単純なモデルの限界」を見せる（R² が低い例を作る）
3. 交互作用項や多項式を導入して R² の改善を示す（研修内容の再現）
4. wlchild2 の追加変数でさらに説明力が上がるか検証する
5. 発表用に結果をまとめる

## コーディング規約

- コメントは日本語で書く
- 変数名・関数名は英語（snake_case）
- グラフのタイトル・軸ラベルは日本語
- 1スクリプトは200行以内を目安にする
