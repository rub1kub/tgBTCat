# testnet validation

Last run: 2026-05-15.

## deployed stack

| role | address |
| --- | --- |
| governor | `kQAX-NQHxBWiZb62iOMVwEJBsao9RNVMHH8iYRvto8peodzJ` |
| jetton master | `kQA2_EY0dYE1AkLd4-Rddw-2pUuP4jMl7HFh1s4Q9uijXEkA` |
| governor vote jetton wallet | `kQAXMOBjyfgPfRS2p79cyTwP6x93I3cQXwO-1eY9Mtzlu75z` |
| fee controller | `kQCG_oVkCouKe4647Q-xzWSiAxPmDeD1ReokBnZlKxThxYmn` |
| wallet fee registry | `kQBJkUeb-GoQ5FxF5ba8W-Tr9CTy3ESdjD_va3chfvLgwryc` |
| dex registry | `kQCAUi43SNnVg2pA7vIQLP6YLUQVun9RVMt2Nt-nsyjjxSvb` |
| treasury | `kQCcM4Z3oG8AnS989rOlD4iWsMvxvIC6Eq1KosWeQd9vG8mr` |
| event controller | `kQDKksYh9AuX3aVqMuC4B91pW2XWGktsnF_nYzu9asJ7HsJZ` |
| fee treasury owner | `kQC2sHx4TKwlHSxCwH-CsZ0DFUzV9zZMdJIaWNTEvc1BLdp7` |

Metadata URI used for this testnet stack:

```text
http://tgbtcat.fun/metadata/jetton-testnet.json
```

The HTTP URL now redirects to HTTPS at the web-server layer. Mainnet should use
the production HTTPS metadata file directly:

```text
https://tgbtcat.fun/metadata/jetton.json
```

## checks passed

| check | result |
| --- | --- |
| `acton build` | passed |
| `acton test --fail-fast` | 99 passed |
| `acton check` | passed |
| `acton fmt --check` | passed |
| `npm run lint` | passed |
| `npm run build` | passed |
| Playwright smoke | page loads, vote page reachable, no console errors |

## on-chain smoke

| scenario | result | transaction |
| --- | --- | --- |
| deploy full stack | governor active, minter active, minter admin is governor, total supply `1000000000000000` | `44aa1123433a34f1ce5a38cf4c03f1fd53e8983cd298a3d5bf5b20b8c8df4e38` |
| create global fee proposal | proposal `#0` created through irreversible jetton transfer | `0d1bc4d514984e05b25d5e0325be917ee4ca4facc7b840574cf9327ee6a976b1` |
| vote global fee proposal | `100000000000` votes for | `1b172807b43e3a9ba80cbfc1692800a6c7236666359bc263018158c6689ed785` |
| execute global fee proposal | buy `111` bps, sell `222` bps | `82ecab82c94868f987366b1b58b5686f1959d663a75137e3a79f059d3626b0a3` |
| create wallet fee proposal | proposal `#1` for a specific address | `b796c4272eef714ecde7ab15d8377f2ddaa7c392d187dc9aa730195f6bfad8fe` |
| vote wallet fee proposal | `100000000000` votes for | `2ad08ea2638d50627521f6ea31f992e16a37c7aa621daa02d4bc3e7e7e5dd799` |
| execute wallet fee proposal | target fee set: buy `333` bps, sell `444` bps | `aa784632b842b72df965a42459cc88773dc928e28511b54b4c08572c7ff022d8` |
| route runtime to seller wallet | wallet runtime updated by governance | `b30281e6365bdf1f3b1e72fda000000fa7bb2b06abc1169214755ff231cf889c` |
| mark DEX owner in seller wallet | DEX address added by governance | `d0a5e2979269c08761294c6f6ca877939a371753b2343c1fa02638693833c509` |
| transfer with DEX sell fee | sent `1000 tgBTCat`; recipient got `977.8`, fee treasury got `22.2` | `04cb85378a65b95ab9b2ff2c324327abb2cc2deb6b34f0fc34de1657e1138ceb` |

## production notes

Before mainnet deploy:

- DNS is pointed to `89.39.121.199`.
- HTTPS is issued for `tgbtcat.fun` and `www.tgbtcat.fun`.
- Deploy mainnet with `https://tgbtcat.fun/metadata/jetton.json`.
- Keep all mnemonics out of git. `wallets.toml` is ignored.
