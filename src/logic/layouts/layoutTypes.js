/**
 * @typedef {Object} SkillTreeLayoutNode
 * @property {string} medalId
 * @property {number} x
 * @property {number} y
 * @property {number} radius
 * @property {number} [yearsRequired]
 * @property {string} [type]
 */

/**
 * @typedef {Object} SkillTreeLayoutConnection
 * @property {string} from
 * @property {string} to
 * @property {string} [type]
 * @property {string} [label]
 */

/**
 * @typedef {Object} SkillTreeLayout
 * @property {SkillTreeLayoutNode[]} medals
 * @property {SkillTreeLayoutConnection[]} connections
 * @property {Object} [meta]
 */

/**
 * @typedef {Object} SkillTreeLayoutPreset
 * @property {string} id
 * @property {string} label
 * @property {string} [description]
 * @property {(medals: any[], options?: any) => SkillTreeLayout} generator
 * @property {any} [defaultOptions]
 */

export {}
