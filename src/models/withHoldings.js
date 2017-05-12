/**
 * Created by yunge on 16/11/8.
 */
import {parse} from "qs";
import withHoldings from "../services/sources";

const {query, create, remove, update} = withHoldings;

export default {

    namespace: 'withHoldings',

    state: {
        list: [],
        field: '',
        keyword: '',
        loading: false,
        total: null,
        current: 1,
        currentItem: {},
        selectedChannels: [],
        modalVisible: false,
        modalType: 'create',
    },

    subscriptions: {
        setup({dispatch, history}) {
            history.listen(location => {
                if (location.pathname === '/withHoldings') {
                    dispatch({
                        type: 'query',
                        payload: location.query,
                    });
                }
            });
        },
    },

    effects: {
        *query({payload}, {call, put}) {
            yield put({type: 'showLoading'});
            yield put({type: 'updateQueryKey', payload});
            const {data} = yield call(query, parse(payload));
            if (data) {
                const {page} =  payload;
                yield put({
                    type: 'querySuccess',
                    payload: {
                        list: data.data,
                        total: data.page.total,
                        current: ~~page || 1,
                    },
                });
            }
        },
        *'delete'({payload}, {call, put}) {
            yield put({type: 'showLoading'});
            const {data} = yield call(remove, {id: payload});
            if (data && data.success) {
                yield put({
                    type: 'deleteSuccess',
                    payload,
                });
            }
        },
        *create({payload}, {call, select, put}) {
            yield put({type: 'hideModal'});
            yield put({type: 'showLoading'});
            const {data} = yield call(create, {payload});
            const {total, current, list}= yield select(({withHoldings: {total, current, list}}) => ({total, current, list}));

            if (data && data.success) {
                yield put({
                    type: 'createSuccess',
                    payload: {
                        list: [data.data].concat(list),
                        total: total + 1,
                        current: current,
                        field: '',
                        keyword: '',
                    },
                });
            }
        },
        *update({payload}, {select, call, put}) {
            yield put({type: 'hideModal'});
            yield put({type: 'showLoading'});
            const id = yield select(({withHoldings}) => withHoldings.currentItem.id);
            const newUser = {...payload, id};
            const {data} = yield call(update, newUser);
            if (data && data.success) {
                yield put({
                    type: 'updateSuccess',
                    payload: newUser,
                });
            }
        },
    },

    reducers: {
        showLoading(state) {
            return {...state, loading: true};
        },
        createSuccess(state, action) {
            // const newUser = action.payload;
            return {...state, ...action.payload, loading: false};
        },
        deleteSuccess(state, action) {
            const id = action.payload;
            const newList = state.list.filter(user => user.id !== id);
            return {...state, list: newList, loading: false};
        },
        updateSuccess(state, action) {
            const updateUser = action.payload;
            const newList = state.list.map(user => {
                if (user.id === updateUser.id) {
                    return {...user, ...updateUser};
                }
                return user;
            });
            return {...state, list: newList, loading: false};
        },
        querySuccess(state, action) {
            return {...state, ...action.payload, loading: false};
        },
        showModal(state, action) {
            return {...state, ...action.payload, modalVisible: true};
        },
        hideModal(state) {
            return {...state, modalVisible: false};
        },
        updateQueryKey(state, action) {
            return {...state, ...action.payload};
        },
    },

};