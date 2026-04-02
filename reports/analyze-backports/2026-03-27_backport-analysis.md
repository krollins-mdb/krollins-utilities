# Backport Configuration Analysis

*Generated 2026-03-27 — 30 projects analyzed*

## At a Glance

| Metric | Count |
| --- | --- |
| Projects with backport configs | 30 |
| Total version directories tracked | 109 |
| Numbered versions (vN.N / vN.x) | 50 |
| Projects using "upcoming" | 29 |
| Projects using "current" | 29 |
| Average versions per project | 3.6 |

## Backport Targets by Project

Each project can backport content to the versions listed below,
ordered from newest to oldest. The **breadth** column shows how many
target versions each project maintains.

| Project | Breadth | Target versions |
| --- | --- | --- |
| mongosync | 10 | v1.10 → v1.11 → v1.12 → v1.13 → v1.14 → v1.15 → v1.16 → v1.17 → v1.18 → current |
| entity-framework | 9 | upcoming → current → v9.1 → v9.0 → v8.4 → v8.3 → v8.2 → v8.1 → v8.0 |
| kafka-connector | 7 | upcoming → current → v1.16 → v1.15 → v1.14 → v1.13 → v1.12 |
| manual | 7 | upcoming → manual → v8.0 → v7.0 → v6.0 → v5.0 → v4.4 |
| kubernetes | 6 | current → v1.5 → v1.4 → v1.3 → v1.2 → v1.1 |
| atlas-cli | 5 | current → v1.52 → v1.51 → v1.50 → v1.49 |
| atlas-operator | 4 | upcoming → current → v2.12 → v2.11 |
| c-driver | 3 | upcoming → current → v1.x |
| cpp-driver | 3 | upcoming → current → v3.x |
| csharp | 3 | upcoming → current → v2.x |
| django-mongodb | 3 | upcoming → current → v5.2 |
| golang | 3 | upcoming → current → v1.x |
| java-rs | 3 | upcoming → current → v5.x |
| laravel-mongodb | 3 | upcoming → current → v4.x |
| mongodb-analyzer | 3 | upcoming → current → v1.x |
| node | 3 | upcoming → current → v6.x |
| php-library | 3 | upcoming → current → v1.x |
| rust | 3 | upcoming → current → v2.x |
| spark-connector | 3 | upcoming → current → v10.x |
| hibernate | 2 | upcoming → current |
| java | 2 | upcoming → current |
| kotlin | 2 | upcoming → current |
| kotlin-sync | 2 | upcoming → current |
| mongoid | 2 | upcoming → current |
| ops-manager | 2 | current → v7.0 |
| pymongo-arrow-driver | 2 | upcoming → current |
| pymongo-driver | 2 | upcoming → current |
| ruby-driver | 2 | upcoming → current |
| scala-driver | 2 | upcoming → current |
| atlas-architecture | 1 | current |

## Source / Target Asymmetry

Most projects allow backporting both *from* and *to* the same set of
versions. The projects below are exceptions — they have versions that
appear only as a source (you can copy from it) or only as a target
(you can paste into it), but not both.

### atlas-architecture

- **Source-only** (can backport *from*, not *to*): upcoming
- **Target-only** (can backport *to*, not *from*): current

### atlas-cli

- **Source-only** (can backport *from*, not *to*): upcoming
- **Target-only** (can backport *to*, not *from*): current, v1.52, v1.51, v1.50, v1.49

### kubernetes

- **Source-only** (can backport *from*, not *to*): upcoming
- **Target-only** (can backport *to*, not *from*): current, v1.5, v1.4, v1.3, v1.2, v1.1

### manual

- **Target-only** (can backport *to*, not *from*): v5.0, v4.4

### ops-manager

- **Source-only** (can backport *from*, not *to*): upcoming
- **Target-only** (can backport *to*, not *from*): current, v7.0


## Versioning Schemes

Projects use different styles for their version directories.
This table groups projects by the versioning pattern they follow.

| Scheme | Count | Projects |
| --- | --- | --- |
| major (vN.x) | 11 | c-driver, cpp-driver, csharp, golang, java-rs, laravel-mongodb, mongodb-analyzer, node, php-library, rust, spark-connector |
| upcoming/current only | 10 | atlas-architecture, hibernate, java, kotlin, kotlin-sync, mongoid, pymongo-arrow-driver, pymongo-driver, ruby-driver, scala-driver |
| minor (vN.N) | 9 | atlas-cli, atlas-operator, django-mongodb, entity-framework, kafka-connector, kubernetes, manual, mongosync, ops-manager |

## Version Ranges

For projects with numbered versions, this shows the oldest and newest
version currently maintained.

| Project | Oldest | Newest |
| --- | --- | --- |
| atlas-cli | v1.49 | v1.52 |
| atlas-operator | v2.11 | v2.12 |
| c-driver | v1.x | v1.x |
| cpp-driver | v3.x | v3.x |
| csharp | v2.x | v2.x |
| django-mongodb | v5.2 | v5.2 |
| entity-framework | v8.0 | v9.1 |
| golang | v1.x | v1.x |
| java-rs | v5.x | v5.x |
| kafka-connector | v1.12 | v1.16 |
| kubernetes | v1.1 | v1.5 |
| laravel-mongodb | v4.x | v4.x |
| manual | v4.4 | v8.0 |
| mongodb-analyzer | v1.x | v1.x |
| mongosync | v1.10 | v1.18 |
| node | v6.x | v6.x |
| ops-manager | v7.0 | v7.0 |
| php-library | v1.x | v1.x |
| rust | v2.x | v2.x |
| spark-connector | v10.x | v10.x |

## Configuration Notes

### Editor settings

| Editor value | Projects |
| --- | --- |
| `code -w` | 27 |
| `code` | 3 |

### Missing `fork` field

3 project(s) do not set the `fork` field in their config:

- entity-framework
- mongodb-analyzer
- pymongo-arrow-driver
