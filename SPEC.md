
# SPEC: Passkey ToDo Board

**(Rails 8.1 + React + DnD, Spec-Driven Development)**

---

## 0. このSPECの位置づけ（重要）

この文書は、**仕様駆動開発（Spec-Driven Development）における唯一の一次情報**である。
実装・設計・タスク分解は、**必ず本SPECを起点**とすること。

* 本SPECに書かれていない機能・データ項目・挙動は **実装してはならない**
* 未確定事項は **DESIGN.md で提案 → 合意後に実装**する
* 推測による補完は禁止

---

## 1. 概要

Ruby on Rails と React を用いて、**GitHub Issues のような UI** を持つ
**シンプルな ToDo 管理アプリ**を開発する。

### 主な特徴

* React UI（ドラッグ&ドロップで並び替え可能）
* 認証は **Passkey（WebAuthn）によるパスワードレス認証のみ**
* DB: PostgreSQL
* デプロイ: Render
* 開発環境: Docker（AIが自律的に実行できることを前提）

---

## 2. ゴール / 非ゴール

### 2.1 ゴール（MUST）

* Passkey のみで以下が可能：

  * ユーザー登録
  * ログイン
  * ログアウト
* 認証済みユーザーが以下を操作できる：

  * ToDo 作成 / 編集 / 完了 / 未完了 / 削除
  * ドラッグ&ドロップによる並び替え（順序は永続化）
* Render にデプロイ可能な構成になっている
* Docker により以下が実行可能：

  * ローカル起動
  * DB作成 / マイグレーション
  * テスト実行

---

### 2.2 非ゴール（今回スコープ外）

以下は **実装してはならない**：

* メール / パスワード認証
* OAuth / SNSログイン
* チーム・共有・招待
* 複数ボード / カンバン
* 高度な権限管理
* リアルタイム同期（WebSocket 等）

---

## 3. 画面 / UX 要件

### 3.1 画面一覧

1. ログイン / 登録画面（Passkey）
2. ToDo リスト画面（メイン）
3. アカウント画面（最小）

   * 登録済み Passkey の有無表示
   * ログアウト

---

### 3.2 ToDo リスト画面要件

* ToDo は縦リスト表示
* 1件の ToDo 表示内容：

  * タイトル
  * 状態（Open / Done）
  * 作成日時（任意）

#### 操作

* 追加
* 編集（タイトル変更）
* 完了 / 未完了切替
* 削除
* ドラッグ&ドロップによる並び替え（Drag handle 推奨）

#### 並び替え

* 並び替え後は即時保存される
* リロード後も順序が保持される

> Done / Open の表示方法・分離有無は DESIGN.md で決定する

---

### 3.3 エラーハンドリング

* ネットワークエラー時はユーザーに簡潔に通知
* 認証エラー時はログイン画面へ誘導

---

## 4. データ要件（DB）

### 4.1 エンティティ

* User
* Credential（WebAuthn Passkey）
* Todo

---

### 4.2 User の方針（重要）

* User は **Passkey 登録完了時に作成**される
* User は以下を持たない：

  * email
  * password
  * username
* User は内部IDのみで識別される

---

### 4.3 Todo のフィールド（最低限）

* user_id : 所有者（必須）
* title : string（必須）
* status : enum（open / done）
* position : 並び順
* timestamps

---

### 4.4 制約

* 本アプリは複数ユーザー前提
* 認証済みユーザーのみ利用可能
* Todo は必ず User に紐づく
* User は **自分の Todo のみ**参照・更新できる
* position は user 単位で整合性が保たれること

---

## 5. 認証要件（Passkey / WebAuthn）

### 5.1 前提

* 認証方式は Passkey のみ
* WebAuthn による registration / authentication を実装する
* cookie-based session を使用する

---

### 5.2 新規登録フロー

1. 「パスキーを作成」ボタン
2. registration challenge を取得
3. Browser WebAuthn API により credential 作成
4. サーバで検証し Credential を保存
5. User を作成し、ログイン状態にする

---

### 5.3 ログインフロー

1. 「パスキーでログイン」
2. authentication challenge を取得
3. Browser WebAuthn API により署名
4. サーバ検証後、セッション確立

---

### 5.4 ログアウト

* セッション破棄

---

### 5.5 WebAuthn 環境前提

* RP ID / Origin は環境変数で管理
* 開発環境では localhost を許可
* 本番では Render のホスト名を使用

---

### 5.6 セキュリティ要件（最低限）

* challenge は短命かつ一回限り
* CSRF 対策は Rails 標準を使用
* 認証成功時のみセッション発行
* セッション Cookie：

  * SameSite=Lax
  * Secure は production のみ
* 重要イベントはログ出力（機密情報は含めない）

---

## 6. API 要件（Rails）

* React から操作可能な JSON API を提供
* API は `/api/*` 名前空間

### 6.1 認証 API（例）

* POST /api/webauthn/registration/options
* POST /api/webauthn/registration/verify
* POST /api/webauthn/authentication/options
* POST /api/webauthn/authentication/verify
* POST /api/logout

---

### 6.2 Todo API（認証必須）

* GET    /api/todos
* POST   /api/todos
* PATCH  /api/todos/:id
* DELETE /api/todos/:id
* PATCH  /api/todos/reorder

---

### 6.3 並び替え API の責務（明示）

* フロントは並び替え後の順序情報（id + position）を送信する
* サーバは以下のみを担当する：

  * 認可チェック
  * 整合性検証
  * 永続化
* position の再計算ロジックは持たない

---

## 7. フロントエンド要件（React）

* Rails アプリ内に統合
* React + TypeScript
* Vite（vite-ruby）を使用
* 認証後は React による擬似 SPA 構成
* HTML の初期配信は Rails View が担当

### UI / State

* DnD: dnd-kit（第一候補）
* 状態管理：React state + fetch 程度で十分
* UI は GitHub Issues を参考に、シンプルに

---

## 8. 技術前提（確定事項）

* Ruby on Rails 8.1
* Rails は API モードではなく full stack
* JSON API は `/api/*`
* 認証は cookie session
* CSRF は Rails 標準

---

## 9. 開発・運用要件

### 9.1 Docker（必須）

* docker compose で以下を起動：

  * web（Rails）
  * db（PostgreSQL）

#### 初期セットアップ

* build
* up
* db:create
* db:migrate
* （任意）seed

---

### 9.2 Render デプロイ

* DATABASE_URL は Render の PostgreSQL を使用
* RAILS_ENV=production に対応
* マイグレーション手順を README に明記

---

## 10. AI 実行前提（重要）

* README の手順は copy & paste で実行可能
* Makefile または script に主要コマンドを定義
* AI が自律的に以下を実行できること：

  * 起動
  * マイグレーション
  * テスト

---

## 11. 品質要件

* 最小限のテストを用意（以下から選択）：

  * モデルバリデーション
  * 認可（自分の Todo のみ操作可能）
  * reorder の整合性
* README に以下を記載：

  * ローカル起動手順
  * 主要コマンド
  * デプロイ手順

---

## 12. 未確定事項（DESIGN.md で提案可）

* UI 詳細（Done 表示方法など）
* position の方式
* WebAuthn ライブラリ選定
* React の詳細構成
* Done / Open フィルタ（Phase2）
* Discoverable Credential（Phase2）

---

## 最終指示（Kiro / AI 向け）

> This project must be developed strictly following this SPEC.
> Do not introduce features or data not explicitly defined.
> Unspecified details must be proposed in DESIGN.md before implementation.

