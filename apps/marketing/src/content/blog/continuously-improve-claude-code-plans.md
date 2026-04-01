---
title: "Continuously Improve Claude Code Plans"
description: "Use your denial history to find feedback patterns, generate a personalized report, and automatically improve every future plan."
date: 2026-04-01
author: "backnotprop"
tags: ["compound-planning", "plan-mode", "claude-code"]
---

**Every time you deny a plan in Claude Code, you're teaching the agent what you care about.** The problem is that feedback disappears into logs. You've already told Claude what you want — dozens, maybe hundreds of times — but each planning session starts from zero. Compound Planning changes that. It reads your denial history, finds the patterns in your feedback, and turns them into instructions that get injected into every future plan.

## Watch the Demo

`VIDEO_PLACEHOLDER`

## The feedback you've already given is the most valuable data you have

Think about the last time Claude proposed a plan you denied. Maybe the approach was wrong. Maybe it missed a constraint you care about. Maybe the structure wasn't what you expected. You wrote feedback, Claude revised, and eventually you approved.

That feedback was precise. It was specific to your codebase, your preferences, your standards. It was the exact specification Claude needed to get it right.

Then the next session started, and none of that context existed.

This is the compounding problem. Every denied plan contains a signal — what you expect, what you reject, what language you use when something is wrong. Across weeks and months, those signals form a pattern. A pattern that, if an agent could see it, would prevent most denials from happening in the first place.

## How plan mode denials work

When you deny a plan in Claude Code, the interaction is recorded in your session logs at `~/.claude/projects/`. The `ExitPlanMode` tool call captures the outcome — approval or denial — and when you write a reason, that reason is stored alongside it.

Plannotator users get an even richer version of this. Every denial is saved as a markdown file with the full plan text and all your annotations — inline comments, deletions, structural feedback. These files accumulate in `~/.plannotator/plans/` and form a detailed archive of exactly how you review plans.

Either way, the data is already there. You've been generating it every time you review a plan. It's just been sitting unused.

## What Compound Planning does

Compound Planning is a skill that reads your entire denial history and produces two things: a personalized HTML report analyzing your feedback patterns, and a set of corrective instructions that can be automatically injected into future planning sessions.

The process works in phases:

**Inventory** — It scans your archive, counts approved and denied plans, calculates your revision rate, and maps the date range. For Plannotator users, this means `*-denied.md` files and annotations. For Claude Code users, it runs a bundled parser that extracts human-authored denial reasons from your JSONL session logs.

**Extraction** — Every denied plan or denial reason is read. For large archives, this happens in parallel across multiple agents. Nothing is sampled or skipped — the value comes from completeness.

**Reduction** — The extracted data is analyzed for patterns. What categories of denial emerge from your actual feedback? What phrases do you use repeatedly? What do agents consistently get wrong for you specifically? How has your feedback evolved over time?

**The report** — A single self-contained HTML file with seven sections that tell the story of your data. Not a generic dashboard — a narrative analysis built from your own words, your own patterns, your own standards. The taxonomy of denial reasons, the evolution of your expectations, and a set of numbered corrective instructions that trace back to real, frequent denial patterns. Every number is calculated, every quote is real.

**The improvement hook** — The most actionable output. The corrective instructions from the report can be saved to a file that Plannotator's `EnterPlanMode` hook injects into every future planning session. Claude sees your feedback patterns before writing any plan. The denials you've already given become the specification for every plan going forward.

## It works for all Claude Code users

Plannotator users get the richest analysis — full plan text, inline annotations, structural feedback, and diff context. But you don't need Plannotator to use Compound Planning.

If you use Claude Code with plan mode, your denial reasons are in your session logs. The skill includes a bundled Python parser that extracts `ExitPlanMode` outcomes from `~/.claude/projects/`, filters out boilerplate, and produces clean JSON records containing only your human-authored feedback. The same extraction, reduction, and report generation pipeline runs on this data.

The report adapts to the data source. Plannotator archives produce richer reports with annotation-level insights. Claude Code logs produce reports focused on denial reasons and the patterns in your feedback language. Both produce the corrective prompt instructions. Both close the loop.

## Your feedback is your specification

The specification paradox says that as agents get more capable, the cost of poor specification rises. A vague plan executed confidently is worse than no plan at all. Speed compounds misalignment.

But most developers already have a specification — they've expressed it through hundreds of plan denials. What structure they expect. What approaches they reject. What level of detail they need. What they mean when they say "too broad" or "wrong approach" or "you're overcomplicating this."

Compound Planning doesn't ask you to write a specification from scratch. It extracts one from the feedback you've already given. Your denied plans aren't failures — they're the training data for better plans.

## Try it

If you have Plannotator installed, the skill is available now. If you're using Claude Code without Plannotator, the skill works with your existing session logs — no additional setup required.

The more denial history you have, the richer the analysis. If you've been using plan mode for weeks or months, you likely have a substantial archive of feedback that's never been put to use. Compound Planning reads all of it, finds what matters, and turns it into something that makes every future plan better.

Start with [Plannotator's installation guide](/docs/getting-started/installation/) or check out the [compound planning skill](https://github.com/backnotprop/plannotator) in the repo.
