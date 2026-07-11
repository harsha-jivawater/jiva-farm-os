# Jiva Farm OS Engineering Roadmap

_Last updated: 2026-07-12_

## Current Priority

### Dispatch Work Items

Goal: move Dispatch actions from direct operational-table reconstruction into the `work_items` read model.

Required stages:

- [ ] inspect current Dispatch My Work rules
- [x] define exact Dispatch action types
- [x] define stable business keys
- [x] create Stage A projection function draft for controlled review
- [x] create Stage A bounded backfill draft for controlled review
- [x] create Stage A reconciliation draft for controlled review
- [x] apply and reconcile Stage A
- [x] validate RLS by representative role
- [x] prepare Stage B guarded triggers for controlled review
- [x] apply and test Stage B guarded triggers
- [ ] prove performance
- [ ] cut over one consumer
- [ ] validate production
- [ ] update engineering documentation

## Completed

### Farmer Lead Read Model

- [x] create `work_items`
- [x] add indexes
- [x] add RLS
- [x] create Farmer Lead candidate and projection functions
- [x] run bounded backfill
- [x] reconcile to zero discrepancies
- [x] add Farmer Lead and Dispatch triggers
- [x] test role parity
- [x] test automatic synchronization
- [x] cut My Work Farmer Lead actions over to `work_items`
- [x] confirm production behavior

### My Work Performance Stabilization

- [x] lazy-load grouped sections
- [x] remove broad timeout-prone aggregate RPCs
- [x] isolate KPI failures
- [x] enforce a bounded initial query budget
- [x] display `View` for unloaded legacy categories
- [x] preserve server-driven section URLs and paging
- [x] confirm production is working

## Next

### Pilots and Visits Read Model

- [ ] define action types
- [ ] establish projection and reconciliation
- [ ] migrate My Work consumer
- [ ] restore lightweight collapsed count

### Marketing Read Model

- [ ] define review and overdue action types
- [ ] establish projection and reconciliation
- [ ] migrate My Work consumer
- [ ] restore lightweight collapsed count

## Future

- [ ] Dealer review work items
- [ ] Institution review work items
- [ ] Installation work items
- [ ] Notification persistence and event generation
- [ ] broader observability cleanup
- [ ] automated performance regression checks

## Delivery Rules

A roadmap item is complete only after:

- code validation passes
- permissions are verified
- production behavior is confirmed
- performance is measured where relevant
- documentation is updated
