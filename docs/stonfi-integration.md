# DEX fee compatibility

## Как идут сделки

tgBTCat берет комиссию внутри своего jetton wallet. STON.fi и DeDust не считают эту комиссию за токен: они получают обычный `transfer_notification` и дальше работают с количеством, которое реально дошло после вычета.

STON.fi v2:

- продажа: пользователь отправляет tgBTCat на owner address Router-а;
- Router получает уведомление от своего tgBTCat wallet и отправляет `swap` или `provide_lp` в Pool;
- Pool считает результат и возвращает Router-у `pay_to`;
- покупка: Router-owned tgBTCat wallet отправляет токены покупателю.

DeDust:

- продажа: пользователь отправляет tgBTCat на Jetton Vault адрес с payload `swap`;
- Vault получает уведомление от своего tgBTCat wallet и сообщает Pool, сколько реально пришло;
- Pool считает результат и просит другой Vault сделать payout;
- покупка: tgBTCat Vault-owned wallet отправляет токены покупателю.

## Что делает tgBTCat

- sell fee включается, когда recipient owner address отмечен как DEX address;
- buy fee включается, когда отправляющий tgBTCat wallet отмечен как DEX wallet;
- новый получатель наследует базовую fee-конфигурацию через внутренний wallet-to-wallet transfer;
- wallet-specific правила не передаются в каждом transfer, чтобы не раздувать сообщения;
- UI и интеграции должны показывать gross, fee и net amount до подписи.

## Ограничения

- Публичный интерфейс STON.fi может ограничивать tax tokens: по их policy taxable token не должен быть промежуточным активом маршрута, а tax выше 10% может быть неподдержан в UI.
- На уровне контрактов STON.fi/DeDust сделки идут через обычные jetton transfers, поэтому direct route может существовать даже если агрегатор или UI его прячет.
- Liquidity add/remove тоже идут через DEX flow и могут попасть под комиссию. Это нужно явно показывать пользователю.
- Для mainnet адреса Router/Vault нужно брать из актуального SDK/API/simulation, не хардкодить вручную.

## Источники

- https://docs.ston.fi/developer-section/dex/architecture
- https://docs.ston.fi/developer-section/dex/smart-contracts/v2/router
- https://blog.ston.fi/tax-tokens-on-ton-what-they-are-and-why-they-arent-on-ston-fi/
- https://docs.dedust.io/docs/concepts
- https://docs.dedust.io/docs/swaps
- https://docs.dedust.io/reference/tlb-schemes
