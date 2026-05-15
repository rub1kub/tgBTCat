# Fee token patterns

## Что делают комиссионные токены

Fee-on-transfer токен берет комиссию внутри собственного transfer flow. Отправитель списывает gross amount, получатель получает net amount, а разница уходит в treasury, burn, rewards/reflection или другую служебную механику.

Типовые модели:

- treasury tax: фиксированный или управляемый процент уходит в казну проекта;
- buy/sell tax: комиссия включается только когда transfer идет через DEX router/pair;
- wallet-specific tax: отдельные адреса получают отдельные правила;
- burn tax: часть transfer сжигается;
- reflection/reward tax: часть распределяется держателям или отдельному reward pool.

## DEX implications

DEX не “считает” эту комиссию за токен. Комиссию считает сам token/jetton wallet во время transfer.

Практическое следствие:

- router/pool получает меньше, чем отправил пользователь;
- пользователь получает меньше, чем отправил router;
- UI должен показывать gross, fee, net;
- min received/slippage нужно считать от net amount;
- добавление/вывод ликвидности тоже может попасть под tax, если оно идет через тот же router flow.

## tgBTCat decision

tgBTCat использует fee-on-transfer модель на уровне jetton wallet:

- sell fee: обычный wallet отправляет в DEX-marked router owner address;
- buy fee: DEX-marked router-owned wallet отправляет обычному покупателю;
- fee treasury получает отдельный internal transfer;
- `get_transfer_fee_quote` дает интеграциям точный quote до отправки.

## Examples checked

- Uniswap token fee docs: https://support.uniswap.org/hc/en-us/articles/18673568523789-What-is-a-token-fee
- Uniswap v3 unsupported token docs: https://developers.uniswap.org/docs/protocols/v3/concepts/unsupported-tokens
- OpenZeppelin ERC20 transfer docs: https://docs.openzeppelin.com/contracts/4.x/api/token/ERC20
- TON jetton transfer docs: https://docs.ton.org/standard/tokens/jettons/transfer
- STON.fi router docs: https://docs.ston.fi/developer-section/dex/smart-contracts/v2/router
