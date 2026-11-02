---
title: section7 语法样例：Markdown、代码与图片
date: 2026-11-03T10:00:00+08:00
type: DEV
tags: [站点, 样例]
summary: 覆盖站点支持的全部 Markdown 语法：标题、表格、提示框、折叠块、代码块、脚注与抖动图片。
---

正文从这里开始，含有 **粗体**、*斜体*、~~删除线~~、`行内代码`和 <kbd>Ctrl</kbd> + <kbd>K</kbd>。链接长这样：[Astro](https://astro.build)。

## 表格

| 项目 | 作用 | 在哪里配置 |
| --- | --- | --- |
| ROA | 声明哪个 ASN 可以宣告这个前缀 | 地址分配方的门户 |
| route 对象 | 写进 IRR，上游据此生成过滤规则 | IRR 数据库 |
| BGP 会话 | 把前缀实际宣告给上游 | 自己的路由器 |

## 代码

```conf title="/etc/bird/bird.conf" {2}
protocol bgp upstream {
    local as 65000;
    neighbor 192.0.2.1 as 64496;
}
```

```ts title="diff.ts"
const a = 1; // [!code --]
const a = 2; // [!code ++]
```

```console
$ birdc show protocols
upstream   BGP   ---   up   Established
```

### 提示框

:::note
先确认 ROA 和 route 对象已经生效，再建立会话。
:::

:::tip[小技巧]
`pnpm new <slug>` 可以生成文章模板。
:::

:::warning
不要把生产密钥提交进仓库。
:::

:::details[点我展开]
折叠块里的内容。
:::

## 图片与脚注

下面这张图默认会被抖动成两色，点击可看原图[^1]。

![一张测试用的渐变图](./sample.jpg "径向渐变 · 抖动后的效果")

![关闭抖动的同一张图](./sample.jpg "同一张图，单张关闭抖动 #nodither")

> 引用块：衬线斜体，左侧 2px 线。

---

- [x] 任务列表
- [ ] 未完成项

[^1]: 脚注区标题为 NOTES。
