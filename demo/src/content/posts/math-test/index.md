---
title: 数学公式测试页
date: 2026-11-02T20:00:00+08:00
type: OI
tags: [数学, 样例]
summary: 覆盖构建期 MathJax→SVG 的 12 类用例，作为回归基线。
---

## 行内公式

行内 $a^2+b^2=c^2$。和中文紧贴：设$x\in\mathbb{R}$，则$x^2\ge 0$。

## 块级公式

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

## 环境

$$
\begin{aligned} f(x) &= (x+1)^2 \\ &= x^2+2x+1 \end{aligned}
$$

$$
A=\begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix},\quad
f(x)=\begin{cases} 0 & x<0 \\ 1 & x\ge 0 \end{cases}
$$

$$
\begin{array}{c|c} a & b \\ \hline c & d \end{array}
$$

## 编号与引用

$$
E = mc^2 \tag{A}
$$

$$
\begin{align}
a &= b + c \label{eq:a} \\
d &= e + f
\end{align}
$$

见公式 $\eqref{eq:a}$。

## 宏

$\newcommand{\RR}{\mathbb{R}}$ 之后可用 $\RR^n$。站点全局宏：$\R$、$\abs{x}$、$\norm{v}$、$\argmin_x f(x)$。

## 常用命令

$\operatorname{lcm}(a,b)$，$\mathcal{O}(n\log n)$，$\boldsymbol{v}$，$\underbrace{1+\cdots+1}_{n}$，$\overset{!}{=}$，$\binom{n}{k}$，$\lfloor x\rfloor$，$a \pmod p$，$\prod_{i}x_i$，$\int_0^1 x\,dx$，$\lim_{n\to\infty}$，${\color{red} x}$。

## 中文

$\text{中文也能显示：} f(x)=\text{价格}\times x$

## 化学式

$\ce{H2O}$ 与 $\ce{CO2 + H2O <=> H2CO3}$。

## Markdown 冲突字符

行内 $a_1 * b_2 * c_3$ 与 $x_1 + x_2$ 不应被解析为强调。

| 记号 | 含义 |
| --- | --- |
| $\lvert x\rvert$ | 绝对值 |
| $\mid$ | 整除 |

## 美元符号

价格 \$5 与 \$10 正常显示。

## 超长公式

$$
a_1+a_2+a_3+a_4+a_5+a_6+a_7+a_8+a_9+a_{10}+a_{11}+a_{12}+a_{13}+a_{14}+a_{15}+a_{16}+a_{17}+a_{18}+a_{19}+a_{20}+a_{21}+a_{22}+a_{23}+a_{24}+a_{25}
$$

## 颜色

公式颜色跟随 `currentColor`：$\sqrt{2}$。
