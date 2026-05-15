# STON.fi integration notes

## Как идет swap

STON.fi v2 не отправляет пользовательские токены напрямую в pool. Пользователь делает обычный jetton transfer в wallet, владельцем которого является Router. Router получает `transfer_notification`, отправляет `swap` или `provide_lp` в Pool, Pool считает результат и возвращает Router-у `pay_to`. После этого Router делает обычный jetton transfer получателю.

Практический вывод для tgBTCat:

- продажа tgBTCat: пользовательский wallet отправляет токены на owner address Router-а. В runtime wallet отправителя Router должен быть добавлен как DEX address.
- покупка tgBTCat: Router-owned tgBTCat wallet отправляет токены покупателю. Runtime этого wallet должен иметь `isDexWallet = true`.
- комиссия считается в tgBTCat jetton wallet, не в STON.fi.
- STON.fi получает или отправляет уже net amount после комиссии.

## Что нужно для запуска

1. Для каждого активного пользовательского wallet, который должен платить sell fee, добавить STON.fi Router address через `RouteAddWalletDexAddress`.
2. Для Router-owned tgBTCat wallet выставить `isDexWallet = true` через `RouteSetWalletFeeRuntime`.
3. В UI считать trade preview от net amount: gross amount, fee, amount to router/user.
4. Для STON.fi mainnet брать Router из simulation result STON.fi API, а не хардкодить один адрес.
5. Перед добавлением ликвидности отдельно решить, должна ли комиссия применяться к liquidity add/remove. Эти операции тоже идут через Router и внешне похожи на обычный transfer.

## Источники

- https://docs.ston.fi/developer-section/dex/architecture
- https://docs.ston.fi/developer-section/dex/smart-contracts/v2/router
- https://docs.ston.fi/developer-section/dex/sdk/v2/swap
- https://github.com/ston-fi/dex-core-v2
