# Process overview

## What I built

Free Hour books ANU Sport's free weekly student court hour online. Today that
hour can only be claimed at the front desk, at most 15 minutes before the
slot. `README.md` makes the case for what good means here.

## How I got here

I pointed the agent at ANU Sport's site:

> https://anu-sport.com.au/我想将这个网站作为我的作业对象 你看看哪些地方可有优化
> (I want this site as my subject; see what could be improved.)

It read the live pages and found three problems: a timetable locked in an
image, rules that contradict each other, and a free hour you can't book
online. I chose that slice from experience:

> 选 b 因为我试过这个网站 它的预定的地方很难找 而且很不好用
> (B, because I've tried it: booking is hard to find and hard to use.)

In plan mode I made the product calls: every listed player uses their hour,
and you can book up to seven days ahead. I also picked the rule groups in
`CLAUDE.md`
([`879470c`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-wuyimin362-sudo/commit/879470c)).
The contract tests came first, red
([`87a5256`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-wuyimin362-sudo/commit/87a5256)).
The schema then turned the fixed rules into constraints
([`736d973`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-wuyimin362-sudo/commit/736d973)),
and the booking flow turned the tests green
([`379a7b7`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-wuyimin362-sudo/commit/379a7b7)).

Once I saw it running, I asked for more:

> UI 风格要和原来的网站相近 而且我要很容易的找到 book 的入口
> (Make it look like the original site, and make the booking entry easy to find.)

The agent read ANU Sport's colours and type from its live pages. It darkened
the three colour pairs that fail contrast, and put a Book a court tab on every
page
([`7aac34f`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-wuyimin362-sudo/commit/7aac34f)).

The correction that mattered was a link check that passed when it shouldn't
have. The test server had inherited pnpm's `NODE_PATH`, so it could load a
library production can't. Running the server the way the Dockerfile does
turned the check red
([`3818d94`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-wuyimin362-sudo/commit/3818d94)),
and the fix turned it green
([`b471f39`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-wuyimin362-sudo/commit/b471f39)).

I knew it worked from two things. `pnpm check` ran 39 checks. Screenshots at
desktop, tablet and phone widths caught three layout regressions in the
restyle.
